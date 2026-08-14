import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Archive,
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  ExternalLink,
  LinkIcon,
  Loader2,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import {
  initializePaddle,
} from "@paddle/paddle-js";

import toast from "react-hot-toast";

import ProjectTabs from "../components/ProjectTabs";
import { useConfirm } from "../components/ConfirmProvider";
import { useAdminI18n } from "../lib/adminI18n";
import { supabase } from "../lib/supabase";
import { slugify } from "../lib/slug";

import {
  revalidatePublicProject,
} from "../lib/revalidateProject";

import {
  getPublicProjectUrl,
} from "../lib/urls";

import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  SkeletonCard,
  Textarea,
} from "../components/ui";


const BILLING_COPY = {
  en: {
    billingTitle:
      "Billing & publishing",

    billingSubtitle:
      "Your CRTRGO subscription controls publishing.",

    plan:
      "CRTRGO Standard",

    perMonth:
      "/ month",

    readyTitle:
      "Ready to go live",

    readyText:
      "Activate CRTRGO Standard to publish this website.",

    included:
      "Included",

    featureWebsite:
      "Hosted digital website and menu",

    featureAddress:
      "Your menu.crtrgo.com address",

    featureLanguages:
      "Arabic, English and Hebrew support",

    featureUpdates:
      "Unlimited menu updates",

    publish:
      "Publish website",

    continuePayment:
      "Continue payment",

    openingCheckout:
      "Opening checkout...",

    confirmingTitle:
      "Confirming payment",

    confirmingText:
      "CRTRGO is waiting for Paddle's secure confirmation. This usually takes only a moment.",

    activeTitle:
      "Subscription active",

    activeText:
      "Billing is active and this website can stay published.",

    active:
      "Active",

    live:
      "Live",

    notPublished:
      "Not published",

    canceled:
      "Canceled",

    incomplete:
      "Payment incomplete",

    pastDue:
      "Past due",

    suspended:
      "Suspended",

    nextPayment:
      "Next payment",

    cancelsOn:
      "Access until",

    cancellationScheduled:
      "Cancellation scheduled",

    cancellationScheduledText:
      "Your subscription will remain active until the end of the current billing period.",

    noDate:
      "Not available yet",

    pastDueTitle:
      "Payment needs attention",

    pastDueGraceText:
      "Your website is still online during CRTRGO's 3-day payment grace period. Update your payment method before the deadline to avoid interruption.",

    pastDueGraceArchivedText:
      "Billing is currently in CRTRGO's 3-day payment grace period. This website is still archived and will remain hidden until restored.",

    gracePeriodEnds:
      "Grace period ends",

    graceLive:
      "Website remains live",

    graceExpiredTitle:
      "Payment overdue",

    graceExpiredText:
      "The payment grace period has ended. This website is no longer published until the billing issue is resolved.",

    graceExpired:
      "Website offline",

    suspendedTitle:
      "Subscription paused",

    suspendedText:
      "This subscription is currently suspended and the website is not published.",

    canceledTitle:
      "Subscription canceled",

    canceledText:
      "You can publish again by starting a new CRTRGO Standard subscription.",

    refreshBilling:
      "Refresh billing",

    manageBilling:
      "Manage billing",

    openingBilling:
      "Opening billing...",

    manageBillingHint:
      "Update payment details, view invoices or manage your subscription securely through Paddle.",

    portalFailed:
      "Could not open billing management.",

    paymentHistory:
      "Payment history",

    paymentHistoryHint:
      "Completed payments for this website.",

    noPayments:
      "No completed payments yet.",

    paid:
      "Paid",

    paymentHistoryFailed:
      "Could not load payment history.",

    secureBilling:
      "Secure billing by Paddle",

    visibilityTitle:
      "Website visibility",

    visibilityHint:
      "Archive the website without changing or canceling its subscription.",

    archivedPaidHint:
      "This website is archived, but its paid subscription is still active.",

    saveFirst:
      "Save your changes before publishing.",

    restoreFirst:
      "Restore this website before starting checkout.",

    missingToken:
      "VITE_PADDLE_CLIENT_TOKEN is missing from the admin app.",

    checkoutFailed:
      "Could not open Paddle checkout.",

    paymentReceived:
      "Payment completed. CRTRGO is verifying it securely...",

    activated:
      "Subscription activated. Your website is ready.",

    alreadyActive:
      "This website already has an active subscription.",

    publicRefreshFailed:
      "Changes were saved, but the public website could not be refreshed immediately.",
  },


  ar: {
    billingTitle:
      "الفوترة والنشر",

    billingSubtitle:
      "اشتراك CRTRGO هو الذي يتحكم في نشر الموقع.",

    plan:
      "CRTRGO Standard",

    perMonth:
      "/ شهر",

    readyTitle:
      "جاهز للنشر",

    readyText:
      "فعّل اشتراك CRTRGO Standard لنشر هذا الموقع.",

    included:
      "يشمل",

    featureWebsite:
      "موقع وقائمة رقمية مستضافة",

    featureAddress:
      "عنوانك على menu.crtrgo.com",

    featureLanguages:
      "دعم العربية والإنجليزية والعبرية",

    featureUpdates:
      "تحديثات غير محدودة للقائمة",

    publish:
      "نشر الموقع",

    continuePayment:
      "متابعة الدفع",

    openingCheckout:
      "جارٍ فتح الدفع...",

    confirmingTitle:
      "جارٍ تأكيد الدفع",

    confirmingText:
      "ينتظر CRTRGO التأكيد الآمن من Paddle. عادةً يستغرق ذلك لحظات فقط.",

    activeTitle:
      "الاشتراك فعال",

    activeText:
      "الفوترة فعالة ويمكن لهذا الموقع أن يبقى منشوراً.",

    active:
      "فعال",

    live:
      "منشور",

    notPublished:
      "غير منشور",

    canceled:
      "ملغي",

    incomplete:
      "الدفع غير مكتمل",

    pastDue:
      "دفعة متأخرة",

    suspended:
      "موقوف",

    nextPayment:
      "الدفعة القادمة",

    cancelsOn:
      "متاح حتى",

    cancellationScheduled:
      "تمت جدولة الإلغاء",

    cancellationScheduledText:
      "سيبقى اشتراكك فعالاً حتى نهاية فترة الفوترة الحالية.",

    noDate:
      "غير متوفر حالياً",

    pastDueTitle:
      "الدفع يحتاج إلى مراجعة",

    pastDueGraceText:
      "موقعك ما زال منشوراً خلال مهلة الدفع لمدة 3 أيام من CRTRGO. حدّث وسيلة الدفع قبل انتهاء المهلة لتجنب توقف الموقع.",

    pastDueGraceArchivedText:
      "الفوترة حالياً ضمن مهلة الدفع لمدة 3 أيام من CRTRGO. الموقع ما زال مؤرشفاً وسيبقى مخفياً حتى يتم استرجاعه.",

    gracePeriodEnds:
      "تنتهي مهلة الدفع",

    graceLive:
      "الموقع ما زال منشوراً",

    graceExpiredTitle:
      "انتهت مهلة الدفع",

    graceExpiredText:
      "انتهت مهلة الدفع ولم يعد الموقع منشوراً. سيعود الموقع بعد معالجة مشكلة الفوترة.",

    graceExpired:
      "الموقع متوقف",

    suspendedTitle:
      "الاشتراك موقوف",

    suspendedText:
      "هذا الاشتراك موقوف حالياً والموقع غير منشور.",

    canceledTitle:
      "تم إلغاء الاشتراك",

    canceledText:
      "يمكنك نشر الموقع مجدداً عن طريق بدء اشتراك CRTRGO Standard جديد.",

    refreshBilling:
      "تحديث حالة الدفع",

    manageBilling:
      "إدارة الفوترة",

    openingBilling:
      "جارٍ فتح الفوترة...",

    manageBillingHint:
      "حدّث بيانات الدفع، شاهد الفواتير أو أدر اشتراكك بأمان عبر Paddle.",

    portalFailed:
      "تعذر فتح إدارة الفوترة.",

    paymentHistory:
      "سجل المدفوعات",

    paymentHistoryHint:
      "المدفوعات المكتملة لهذا الموقع.",

    noPayments:
      "لا توجد مدفوعات مكتملة بعد.",

    paid:
      "مدفوع",

    paymentHistoryFailed:
      "تعذر تحميل سجل المدفوعات.",

    secureBilling:
      "دفع آمن بواسطة Paddle",

    visibilityTitle:
      "ظهور الموقع",

    visibilityHint:
      "أرشف الموقع بدون تغيير أو إلغاء الاشتراك.",

    archivedPaidHint:
      "الموقع مؤرشف، لكن اشتراكه المدفوع ما زال فعالاً.",

    saveFirst:
      "احفظ التغييرات قبل نشر الموقع.",

    restoreFirst:
      "استرجع الموقع قبل بدء عملية الدفع.",

    missingToken:
      "متغير VITE_PADDLE_CLIENT_TOKEN غير موجود في تطبيق الإدارة.",

    checkoutFailed:
      "تعذر فتح صفحة الدفع عبر Paddle.",

    paymentReceived:
      "تم الدفع. يقوم CRTRGO الآن بالتحقق منه بشكل آمن...",

    activated:
      "تم تفعيل الاشتراك. موقعك جاهز.",

    alreadyActive:
      "هذا الموقع لديه اشتراك فعال بالفعل.",

    publicRefreshFailed:
      "تم حفظ التغييرات، لكن تعذر تحديث الموقع المنشور فوراً.",
  },
};


async function loadProject(
  projectId
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "projects"
      )
      .select(
        "*"
      )
      .eq(
        "id",
        projectId
      )
      .single();


  if (
    error
  ) {
    throw error;
  }


  return data;
}


async function loadSubscription(
  projectId
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "subscriptions"
      )
      .select(`
        id,
        project_id,
        owner_id,
        provider,
        plan_code,
        amount,
        currency,
        status,
        provider_status,
        provider_customer_id,
        provider_subscription_id,
        provider_price_id,
        current_period_start,
        current_period_end,
        next_charge_at,
        cancel_at_period_end,
        canceled_at,
        past_due_at,
        grace_period_ends_at,
        updated_at
      `)
      .eq(
        "project_id",
        projectId
      )
      .maybeSingle();


  if (
    error
  ) {
    throw error;
  }


  return data ||
    null;
}


async function loadStandardPlan() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "billing_plans"
      )
      .select(`
        id,
        name,
        description,
        monthly_price,
        currency,
        paddle_price_id,
        is_active
      `)
      .eq(
        "id",
        "standard"
      )
      .eq(
        "is_active",
        true
      )
      .maybeSingle();


  if (
    error
  ) {
    throw error;
  }


  return data ||
    null;
}


async function loadPaymentHistory(
  projectId
) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_my_payment_history",
      {
        p_project_id:
          projectId,
      }
    );


  if (
    error
  ) {
    throw error;
  }


  return (
    data ||
    []
  ).filter(
    (
      payment
    ) =>
      payment.event_type ===
      "transaction.completed"
  );
}


function emptyToNull(
  value
) {
  const clean =
    String(
      value ||
        ""
    ).trim();


  return clean ||
    null;
}


function getInitialForm(
  project
) {
  return {
    name:
      project?.name ||
      "",

    slug:
      project?.slug ||
      "",

    description:
      project?.description ||
      "",

    location:
      project?.location ||
      "",

    phone:
      project?.phone ||
      "",

    whatsapp:
      project?.whatsapp ||
      "",

    instagram:
      project?.instagram ||
      "",

    facebook:
      project?.facebook ||
      "",

    tiktok:
      project?.tiktok ||
      "",
  };
}


function getBillingStatusTone(
  status
) {
  if (
    status ===
    "active"
  ) {
    return "success";
  }


  if (
    status ===
      "past_due" ||
    status ===
      "suspended"
  ) {
    return "warning";
  }


  return "neutral";
}


function getBillingStatusLabel(
  status,
  copy
) {
  if (
    status ===
    "active"
  ) {
    return copy.active;
  }


  if (
    status ===
    "past_due"
  ) {
    return copy.pastDue;
  }


  if (
    status ===
    "suspended"
  ) {
    return copy.suspended;
  }


  if (
    status ===
    "canceled"
  ) {
    return copy.canceled;
  }


  if (
    status ===
    "incomplete"
  ) {
    return copy.incomplete;
  }


  return copy.notPublished;
}


function formatBillingDate(
  value,
  dir
) {
  if (
    !value
  ) {
    return null;
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }


  return new Intl.DateTimeFormat(
    dir ===
    "rtl"
      ? "ar-IL"
      : "en-IL",
    {
      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    date
  );
}


function formatPlanPrice(
  value
) {
  const amount =
    Number(
      value
    );


  if (
    !Number.isFinite(
      amount
    )
  ) {
    return "₪119";
  }


  return `₪${new Intl.NumberFormat(
    "en-IL",
    {
      maximumFractionDigits:
        2,
    }
  ).format(
    amount
  )}`;
}


function formatPaymentAmount(
  value,
  currency
) {
  const amount =
    Number(
      value
    );


  if (
    !Number.isFinite(
      amount
    )
  ) {
    return "—";
  }


  const formatted =
    new Intl.NumberFormat(
      "en-IL",
      {
        minimumFractionDigits:
          0,

        maximumFractionDigits:
          2,
      }
    ).format(
      amount
    );


  if (
    currency ===
    "ILS"
  ) {
    return `₪${formatted}`;
  }


  return `${formatted} ${
    currency ||
    ""
  }`.trim();
}


async function getFunctionErrorMessage(
  error,
  fallback
) {
  try {
    if (
      error?.context &&
      typeof error.context.json ===
        "function"
    ) {
      const body =
        await error.context.json();


      if (
        body?.error
      ) {
        return body.error;
      }
    }
  } catch {
    // Ignore response parsing errors.
  }


  return (
    error?.message ||
    fallback
  );
}

export default function ProjectGeneralPage() {
  const {
    projectId,
  } =
    useParams();


  const navigate =
    useNavigate();


  const confirm =
    useConfirm();


  const {
    t,
    dir,
  } =
    useAdminI18n();


  const billingCopy =
    dir ===
    "rtl"
      ? BILLING_COPY.ar
      : BILLING_COPY.en;


  const queryClient =
    useQueryClient();


  const checkoutCompletedRef =
    useRef(
      false
    );


  const [
    form,
    setForm,
  ] =
    useState(
      null
    );


  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );


  const [
    changingStatus,
    setChangingStatus,
  ] =
    useState(
      false
    );


  const [
    deleting,
    setDeleting,
  ] =
    useState(
      false
    );


  const [
    checkoutLoading,
    setCheckoutLoading,
  ] =
    useState(
      false
    );


  const [
    portalLoading,
    setPortalLoading,
  ] =
    useState(
      false
    );


  const [
    waitingForActivation,
    setWaitingForActivation,
  ] =
    useState(
      false
    );


  const [
    billingClock,
    setBillingClock,
  ] =
    useState(
      () =>
        Date.now()
    );


  const {
    data:
      project,

    isLoading,

    error,

    isFetching,
  } =
    useQuery({
      queryKey: [
        "project",
        projectId,
      ],

      queryFn:
        () =>
          loadProject(
            projectId
          ),

      enabled:
        Boolean(
          projectId
        ),
    });


  const {
    data:
      subscription,

    isLoading:
      subscriptionLoading,

    isFetching:
      subscriptionFetching,

    refetch:
      refetchSubscription,
  } =
    useQuery({
      queryKey: [
        "project-subscription",
        projectId,
      ],

      queryFn:
        () =>
          loadSubscription(
            projectId
          ),

      enabled:
        Boolean(
          projectId
        ),

      refetchInterval:
        waitingForActivation
          ? 2000
          : false,
    });


  const {
    data:
      billingPlan,
  } =
    useQuery({
      queryKey: [
        "billing-plan",
        "standard",
      ],

      queryFn:
        loadStandardPlan,
    });


  const {
    data:
      paymentHistory = [],

    isLoading:
      paymentHistoryLoading,

    isFetching:
      paymentHistoryFetching,

    error:
      paymentHistoryError,

    refetch:
      refetchPaymentHistory,
  } =
    useQuery({
      queryKey: [
        "project-payment-history",
        projectId,
      ],

      queryFn:
        () =>
          loadPaymentHistory(
            projectId
          ),

      enabled:
        Boolean(
          projectId
        ),
    });


  const initialForm =
    useMemo(
      () => {
        if (
          !project
        ) {
          return null;
        }


        return getInitialForm(
          project
        );
      },
      [
        project,
      ]
    );


  const dirty =
    useMemo(
      () => {
        if (
          !form ||
          !initialForm
        ) {
          return false;
        }


        return (
          JSON.stringify(
            form
          ) !==
          JSON.stringify(
            initialForm
          )
        );
      },
      [
        form,
        initialForm,
      ]
    );


  useEffect(() => {
    if (
      !project
    ) {
      return;
    }


    setForm(
      getInitialForm(
        project
      )
    );
  }, [
    project?.id,
  ]);


  useEffect(() => {
    if (
      !waitingForActivation ||
      subscription?.status !==
        "active"
    ) {
      return;
    }


    setWaitingForActivation(
      false
    );


    checkoutCompletedRef.current =
      false;


    toast.success(
      billingCopy.activated
    );


    queryClient.invalidateQueries({
      queryKey: [
        "projects",
      ],
    });


    queryClient.invalidateQueries({
      queryKey: [
        "project",
        projectId,
      ],
    });


    queryClient.invalidateQueries({
      queryKey: [
        "project-subscription",
        projectId,
      ],
    });


    queryClient.invalidateQueries({
      queryKey: [
        "project-payment-history",
        projectId,
      ],
    });
  }, [
    waitingForActivation,
    subscription?.status,
    projectId,
    queryClient,
    billingCopy.activated,
  ]);


  /*
   * When someone opens Paddle billing
   * in another tab and returns to CRTRGO,
   * refresh the subscription automatically.
   */
  useEffect(() => {
    function handleVisibilityChange() {
      if (
        document.visibilityState !==
        "visible"
      ) {
        return;
      }


      setBillingClock(
        Date.now()
      );


      queryClient.invalidateQueries({
        queryKey: [
          "project-subscription",
          projectId,
        ],
      });


      queryClient.invalidateQueries({
        queryKey: [
          "project-payment-history",
          projectId,
        ],
      });
    }


    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );


    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    projectId,
    queryClient,
  ]);


  /*
   * A past-due subscription can cross its
   * grace deadline while the admin page is
   * still open. Keep the UI clock fresh so
   * publishing state changes automatically.
   */
  useEffect(() => {
    if (
      subscription?.status !==
      "past_due"
    ) {
      return;
    }


    setBillingClock(
      Date.now()
    );


    const timer =
      window.setInterval(
        () => {
          setBillingClock(
            Date.now()
          );
        },
        30000
      );


    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    subscription?.status,
    subscription?.grace_period_ends_at,
  ]);


  function updateField(
    key,
    value
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        [
          key
        ]:
          value,
      })
    );
  }


  async function refresh() {
    setBillingClock(
      Date.now()
    );


    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "project",
          projectId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "projects",
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "project-menu",
          projectId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "project-appearance",
          projectId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "project-languages",
          projectId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "project-subscription",
          projectId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "project-payment-history",
          projectId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "billing-plan",
          "standard",
        ],
      }),
    ]);
  }


  async function saveChanges(
    event
  ) {
    event.preventDefault();


    if (
      !project ||
      !form ||
      !dirty
    ) {
      return;
    }


    const name =
      form.name.trim();


    const slug =
      slugify(
        form.slug
      );


    const previousSlug =
      project.slug;


    if (
      !name
    ) {
      toast.error(
        t(
          "general.nameRequired"
        )
      );


      return;
    }


    if (
      !slug
    ) {
      toast.error(
        t(
          "general.hostnameRequired"
        )
      );


      return;
    }


    setSaving(
      true
    );


    try {
      const {
        data:
          duplicate,

        error:
          duplicateError,
      } =
        await supabase
          .from(
            "projects"
          )
          .select(
            "id"
          )
          .ilike(
            "slug",
            slug
          )
          .neq(
            "id",
            project.id
          )
          .maybeSingle();


      if (
        duplicateError
      ) {
        throw duplicateError;
      }


      if (
        duplicate
      ) {
        toast.error(
          t(
            "general.hostnameTaken"
          )
        );


        return;
      }


      const {
        error,
      } =
        await supabase
          .from(
            "projects"
          )
          .update({
            name,

            slug,

            description:
              emptyToNull(
                form.description
              ),

            location:
              emptyToNull(
                form.location
              ),

            phone:
              emptyToNull(
                form.phone
              ),

            whatsapp:
              emptyToNull(
                form.whatsapp
              ),

            instagram:
              emptyToNull(
                form.instagram
              ),

            facebook:
              emptyToNull(
                form.facebook
              ),

            tiktok:
              emptyToNull(
                form.tiktok
              ),
          })
          .eq(
            "id",
            project.id
          );


      if (
        error
      ) {
        throw error;
      }


      const revalidation =
        await revalidatePublicProject(
          project.id,
          {
            previousSlug,
          }
        );


      toast.success(
        t(
          "general.saved"
        )
      );


      if (
        !revalidation.ok
      ) {
        toast.error(
          billingCopy.publicRefreshFailed
        );
      }


      await refresh();
    } catch (
      err
    ) {
      toast.error(
        err?.message ||
          t(
            "general.saveFailed"
          )
      );
    } finally {
      setSaving(
        false
      );
    }
  }


  async function archiveOrRestore() {
    if (
      !project
    ) {
      return;
    }


    const willArchive =
      project.status !==
      "archived";


    const ok =
      await confirm({
        title:
          willArchive
            ? t(
                "general.archiveTitle"
              )
            : t(
                "general.restoreTitle"
              ),

        message:
          willArchive
            ? t(
                "general.archiveMessage"
              )
            : t(
                "general.restoreMessage"
              ),

        confirmText:
          willArchive
            ? t(
                "general.archiveWebsite"
              )
            : t(
                "general.restoreWebsite"
              ),

        danger:
          willArchive,
      });


    if (
      !ok
    ) {
      return;
    }


    setChangingStatus(
      true
    );


    try {
      const {
        error,
      } =
        await supabase
          .from(
            "projects"
          )
          .update({
            status:
              willArchive
                ? "archived"
                : "active",
          })
          .eq(
            "id",
            project.id
          );


      if (
        error
      ) {
        throw error;
      }


      const revalidation =
        await revalidatePublicProject(
          project.id
        );


      toast.success(
        willArchive
          ? t(
              "general.archivedSuccess"
            )
          : t(
              "general.restoredSuccess"
            )
      );


      if (
        !revalidation.ok
      ) {
        toast.error(
          billingCopy.publicRefreshFailed
        );
      }


      await refresh();
    } catch (
      err
    ) {
      toast.error(
        err?.message ||
          t(
            "general.statusFailed"
          )
      );
    } finally {
      setChangingStatus(
        false
      );
    }
  }

  async function openPaddleCheckout() {
    if (
      !project
    ) {
      return;
    }


    if (
      dirty
    ) {
      toast.error(
        billingCopy.saveFirst
      );


      return;
    }


    if (
      project.status ===
      "archived"
    ) {
      toast.error(
        billingCopy.restoreFirst
      );


      return;
    }


    const paddleToken =
      String(
        import.meta.env
          .VITE_PADDLE_CLIENT_TOKEN ||
          ""
      ).trim();


    if (
      !paddleToken
    ) {
      toast.error(
        billingCopy.missingToken
      );


      return;
    }


    setCheckoutLoading(
      true
    );


    checkoutCompletedRef.current =
      false;


    try {
      const {
        data,

        error:
          functionError,
      } =
        await supabase.functions.invoke(
          "create-paddle-checkout-session",
          {
            body: {
              projectId:
                project.id,
            },
          }
        );


      if (
        functionError
      ) {
        const message =
          await getFunctionErrorMessage(
            functionError,
            billingCopy.checkoutFailed
          );


        throw new Error(
          message
        );
      }


      if (
        data?.alreadyActive
      ) {
        await refetchSubscription();


        toast.success(
          billingCopy.alreadyActive
        );


        return;
      }


      if (
        !data?.priceId ||
        !data?.checkoutToken
      ) {
        throw new Error(
          billingCopy.checkoutFailed
        );
      }


      setWaitingForActivation(
        true
      );


      await refetchSubscription();


      const paddle =
        await initializePaddle({
          token:
            paddleToken,

          ...(paddleToken.startsWith(
            "test_"
          )
            ? {
                environment:
                  "sandbox",
              }
            : {}),

          eventCallback:
            (
              event
            ) => {
              if (
                event?.name ===
                "checkout.completed"
              ) {
                checkoutCompletedRef.current =
                  true;


                setWaitingForActivation(
                  true
                );


                toast.success(
                  billingCopy.paymentReceived
                );


                queryClient.invalidateQueries({
                  queryKey: [
                    "project-subscription",
                    projectId,
                  ],
                });


                queryClient.invalidateQueries({
                  queryKey: [
                    "project-payment-history",
                    projectId,
                  ],
                });
              }


              if (
                event?.name ===
                  "checkout.closed" &&
                !checkoutCompletedRef.current
              ) {
                setWaitingForActivation(
                  false
                );
              }
            },
        });


      if (
        !paddle
      ) {
        throw new Error(
          billingCopy.checkoutFailed
        );
      }


      paddle.Checkout.open({
        settings: {
          displayMode:
            "overlay",

          theme:
            "dark",

          variant:
            "one-page",
        },


        items: [
          {
            priceId:
              data.priceId,

            quantity:
              1,
          },
        ],


        customData: {
          checkout_token:
            data.checkoutToken,
        },


        ...(data?.customer
          ?.email
          ? {
              customer: {
                email:
                  data.customer
                    .email,
              },
            }
          : {}),
      });
    } catch (
      err
    ) {
      setWaitingForActivation(
        false
      );


      toast.error(
        err?.message ||
          billingCopy.checkoutFailed
      );
    } finally {
      setCheckoutLoading(
        false
      );
    }
  }


  async function openBillingPortal() {
    if (
      !project
    ) {
      return;
    }


    const portalWindow =
      window.open(
        "about:blank",
        "_blank"
      );


    if (
      portalWindow
    ) {
      portalWindow.opener =
        null;
    }


    setPortalLoading(
      true
    );


    try {
      const {
        data,

        error:
          functionError,
      } =
        await supabase.functions.invoke(
          "create-paddle-portal-session",
          {
            body: {
              projectId:
                project.id,
            },
          }
        );


      if (
        functionError
      ) {
        const message =
          await getFunctionErrorMessage(
            functionError,
            billingCopy.portalFailed
          );


        throw new Error(
          message
        );
      }


      if (
        !data?.url
      ) {
        throw new Error(
          billingCopy.portalFailed
        );
      }


      if (
        portalWindow &&
        !portalWindow.closed
      ) {
        portalWindow.location.replace(
          data.url
        );


        return;
      }


      window.location.assign(
        data.url
      );
    } catch (
      err
    ) {
      if (
        portalWindow &&
        !portalWindow.closed
      ) {
        portalWindow.close();
      }


      toast.error(
        err?.message ||
          billingCopy.portalFailed
      );
    } finally {
      setPortalLoading(
        false
      );
    }
  }


  async function refreshBilling() {
    setBillingClock(
      Date.now()
    );


    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "project-subscription",
          projectId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "project-payment-history",
          projectId,
        ],
      }),
    ]);


    await Promise.all([
      refetchSubscription(),
      refetchPaymentHistory(),
    ]);
  }


  async function deleteProject() {
    if (
      !project
    ) {
      return;
    }


    const ok =
      await confirm({
        title:
          t(
            "general.deleteTitle"
          ),

        message:
          t(
            "general.deleteMessage"
          ),

        confirmText:
          t(
            "general.deleteForever"
          ),

        danger:
          true,
      });


    if (
      !ok
    ) {
      return;
    }


    setDeleting(
      true
    );


    try {
      /*
       * Revalidate while the project still
       * exists so the Edge Function can
       * verify ownership and resolve its
       * current public slug.
       */
      const revalidation =
        await revalidatePublicProject(
          project.id
        );


      const {
        error,
      } =
        await supabase
          .from(
            "projects"
          )
          .delete()
          .eq(
            "id",
            project.id
          );


      if (
        error
      ) {
        throw error;
      }


      toast.success(
        t(
          "general.deletedSuccess"
        )
      );


      if (
        !revalidation.ok
      ) {
        toast.error(
          billingCopy.publicRefreshFailed
        );
      }


      queryClient.invalidateQueries({
        queryKey: [
          "projects",
        ],
      });


      navigate(
        "/",
        {
          replace:
            true,
        }
      );
    } catch (
      err
    ) {
      toast.error(
        err?.message ||
          t(
            "general.deleteFailed"
          )
      );
    } finally {
      setDeleting(
        false
      );
    }
  }


  if (
    isLoading
  ) {
    return (
      <main
        dir={
          dir
        }
        className="h-full overflow-y-auto bg-[#090909] p-5 text-white"
      >
        <SkeletonCard className="h-40" />

        <SkeletonCard className="mt-5 h-[600px]" />
      </main>
    );
  }


  if (
    error ||
    !project ||
    !form
  ) {
    return (
      <main
        dir={
          dir
        }
        className="h-full overflow-y-auto bg-[#090909] p-5 text-white"
      >
        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error?.message ||
            t(
              "project.notFound"
            )}
        </p>
      </main>
    );
  }


  const archived =
    project.status ===
    "archived";


  const subscriptionStatus =
    subscription?.status ||
    "none";


  const subscriptionActive =
    subscriptionStatus ===
    "active";


  const subscriptionIncomplete =
    subscriptionStatus ===
    "incomplete";


  const subscriptionPastDue =
    subscriptionStatus ===
    "past_due";


  const subscriptionSuspended =
    subscriptionStatus ===
    "suspended";


  const subscriptionCanceled =
    subscriptionStatus ===
    "canceled";


  const gracePeriodEndMs =
    subscription
      ?.grace_period_ends_at
      ? new Date(
          subscription
            .grace_period_ends_at
        ).getTime()
      : NaN;


  const gracePeriodActive =
    subscriptionPastDue &&
    Number.isFinite(
      gracePeriodEndMs
    ) &&
    gracePeriodEndMs >
      billingClock;


  const gracePeriodExpired =
    subscriptionPastDue &&
    !gracePeriodActive;


  const publiclyEntitled =
    !archived &&
    (
      subscriptionActive ||
      gracePeriodActive
    );


  const canManageBilling =
    Boolean(
      subscription
        ?.provider_customer_id
    );


  const canStartNewCheckout =
    !archived &&
    (
      subscriptionStatus ===
        "none" ||
      subscriptionIncomplete ||
      subscriptionCanceled
    );


  const nextPaymentDate =
    formatBillingDate(
      subscription
        ?.next_charge_at ||
        subscription
          ?.current_period_end,
      dir
    );


  const cancellationDate =
    formatBillingDate(
      subscription
        ?.current_period_end,
      dir
    );


  const gracePeriodEndDate =
    formatBillingDate(
      subscription
        ?.grace_period_ends_at,
      dir
    );


  const publicUrl =
    getPublicProjectUrl(
      form.slug
    );


  const planPrice =
    formatPlanPrice(
      billingPlan
        ?.monthly_price ??
        subscription?.amount ??
        119
    );


  const planName =
    billingPlan?.name ||
    billingCopy.plan;


  const pageStatusTone =
    archived
      ? "warning"
      : gracePeriodActive
        ? "warning"
        : subscriptionActive
          ? "success"
          : "neutral";


  const pageStatusLabel =
    archived
      ? t(
          "common.archived"
        )
      : publiclyEntitled
        ? billingCopy.live
        : billingCopy.notPublished;

  return (
    <main
      dir={
        dir
      }
      className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#090909] text-white"
    >
      <PageHeader
        eyebrow={t(
          "project.websiteSettings"
        )}
        title={
          project.name
        }
        subtitle={t(
          "general.subtitle"
        )}
        action={
          publiclyEntitled ? (
            <a
              href={
                publicUrl
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white/70 transition hover:border-[#ff7a00]/40 hover:bg-[#ff7a00]/10 hover:text-[#ff9b3d]"
            >
              <ExternalLink
                size={
                  17
                }
              />

              {t(
                "general.openWebsite"
              )}
            </a>
          ) : null
        }
      />


      <ProjectTabs
        projectId={
          projectId
        }
      />


      <form
        onSubmit={
          saveChanges
        }
        className="mx-auto w-full max-w-7xl px-4 py-6 pb-32 sm:px-6"
      >
        <Link
          to="/"
          className="inline-flex cursor-pointer items-center gap-2 py-2 text-sm font-black text-white/45 transition hover:text-white"
        >
          <ArrowLeft
            size={
              16
            }
            className={
              dir ===
              "rtl"
                ? "rotate-180"
                : ""
            }
          />

          {t(
            "general.backToWebsites"
          )}
        </Link>


        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.05em]">
              {t(
                "project.general"
              )}
            </h2>

            <p className="mt-1 text-sm font-bold text-white/35">
              {t(
                "general.generalHint"
              )}
            </p>
          </div>


          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                pageStatusTone
              }
            >
              {
                pageStatusLabel
              }
            </Badge>


            {(isFetching ||
              subscriptionFetching ||
              paymentHistoryFetching) && (
              <Badge tone="neutral">
                <Loader2
                  size={
                    13
                  }
                  className="animate-spin"
                />

                {t(
                  "common.syncing"
                )}
              </Badge>
            )}
          </div>
        </div>


        <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className="grid min-w-0 gap-5">

            {/* WEBSITE IDENTITY */}

            <Card className="p-5">
              <h3 className="text-xl font-black">
                {t(
                  "general.identity"
                )}
              </h3>


              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field
                  label={t(
                    "project.websiteName"
                  )}
                >
                  <Input
                    value={
                      form.name
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                  />
                </Field>


                <Field
                  label={t(
                    "project.hostname"
                  )}
                >
                  <Input
                    value={
                      form.slug
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "slug",
                        event.target.value
                      )
                    }
                    onBlur={() =>
                      updateField(
                        "slug",
                        slugify(
                          form.slug
                        )
                      )
                    }
                    dir="ltr"
                  />
                </Field>
              </div>


              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/35">
                  <LinkIcon
                    size={
                      14
                    }
                  />

                  {t(
                    "general.publicUrl"
                  )}
                </p>


                {publiclyEntitled ? (
                  <a
                    href={
                      publicUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-all text-sm font-black text-[#ff7a00] transition hover:text-[#ff9b3d]"
                    dir="ltr"
                  >
                    {
                      publicUrl
                    }
                  </a>
                ) : (
                  <p
                    className="mt-2 break-all text-sm font-black text-white/45"
                    dir="ltr"
                  >
                    {
                      publicUrl
                    }
                  </p>
                )}
              </div>
            </Card>


            {/* WEBSITE INFORMATION */}

            <Card className="p-5">
              <h3 className="text-xl font-black">
                {t(
                  "general.information"
                )}
              </h3>


              <div className="mt-5 grid gap-4">
                <Field
                  label={t(
                    "project.description"
                  )}
                >
                  <Textarea
                    value={
                      form.description
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "description",
                        event.target.value
                      )
                    }
                  />
                </Field>


                <Field
                  label={t(
                    "project.location"
                  )}
                >
                  <Input
                    value={
                      form.location
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "location",
                        event.target.value
                      )
                    }
                    placeholder={t(
                      "general.locationPlaceholder"
                    )}
                  />
                </Field>
              </div>
            </Card>


            {/* CONTACT */}

            <Card className="p-5">
              <h3 className="text-xl font-black">
                {t(
                  "project.contactSocial"
                )}
              </h3>


              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field
                  label={t(
                    "general.phone"
                  )}
                >
                  <Input
                    value={
                      form.phone
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "phone",
                        event.target.value
                      )
                    }
                    dir="ltr"
                  />
                </Field>


                <Field label="WhatsApp">
                  <Input
                    value={
                      form.whatsapp
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "whatsapp",
                        event.target.value
                      )
                    }
                    dir="ltr"
                  />
                </Field>


                <Field label="Instagram">
                  <Input
                    value={
                      form.instagram
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "instagram",
                        event.target.value
                      )
                    }
                    dir="ltr"
                  />
                </Field>


                <Field label="Facebook">
                  <Input
                    value={
                      form.facebook
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "facebook",
                        event.target.value
                      )
                    }
                    dir="ltr"
                  />
                </Field>


                <Field label="TikTok">
                  <Input
                    value={
                      form.tiktok
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "tiktok",
                        event.target.value
                      )
                    }
                    dir="ltr"
                  />
                </Field>
              </div>
            </Card>
          </section>


          {/* RIGHT SIDEBAR */}

          <aside className="grid h-fit gap-5 xl:sticky xl:top-6">

            {/* BILLING + PUBLISHING */}

            <Card className="overflow-hidden border-[#ff7a00]/20 bg-gradient-to-b from-[#17110c] to-[#111111]">
              <div className="h-1 w-full bg-[#ff7a00]" />


              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#ff7a00]/20 bg-[#ff7a00]/10 text-[#ff8d22]">
                      <CreditCard
                        size={
                          20
                        }
                      />
                    </div>


                    <div className="min-w-0">
                      <h3 className="text-xl font-black">
                        {
                          billingCopy.billingTitle
                        }
                      </h3>

                      <p className="mt-1 text-xs font-bold leading-5 text-white/35">
                        {
                          billingCopy.billingSubtitle
                        }
                      </p>
                    </div>
                  </div>


                  {!subscriptionLoading && (
                    <Badge
                      tone={getBillingStatusTone(
                        subscriptionStatus
                      )}
                    >
                      {getBillingStatusLabel(
                        subscriptionStatus,
                        billingCopy
                      )}
                    </Badge>
                  )}
                </div>


                {subscriptionLoading ? (
                  <div className="mt-6 grid gap-3">
                    <div className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />

                    <div className="h-12 animate-pulse rounded-2xl bg-white/[0.04]" />
                  </div>
                ) : (
                  <>

                    {/* ACTIVE */}

                    {subscriptionActive && (
                      <>
                        <div className="mt-6 rounded-[22px] border border-emerald-400/15 bg-emerald-500/[0.07] p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                              <CheckCircle2
                                size={
                                  18
                                }
                              />
                            </div>


                            <div>
                              <p className="font-black text-emerald-100">
                                {
                                  billingCopy.activeTitle
                                }
                              </p>

                              <p className="mt-1 text-xs font-bold leading-5 text-emerald-100/50">
                                {
                                  billingCopy.activeText
                                }
                              </p>
                            </div>
                          </div>
                        </div>


                        <div className="mt-4 grid gap-3">
                          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                            <span className="text-xs font-black text-white/35">
                              {
                                planName
                              }
                            </span>

                            <strong className="text-sm font-black">
                              {
                                planPrice
                              }

                              <span className="ms-1 text-[10px] text-white/30">
                                {
                                  billingCopy.perMonth
                                }
                              </span>
                            </strong>
                          </div>


                          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                            <span className="text-xs font-black text-white/35">
                              {subscription
                                ?.cancel_at_period_end
                                ? billingCopy.cancelsOn
                                : billingCopy.nextPayment}
                            </span>

                            <strong className="text-xs font-black text-white/80">
                              {subscription
                                ?.cancel_at_period_end
                                ? cancellationDate ||
                                  billingCopy.noDate
                                : nextPaymentDate ||
                                  billingCopy.noDate}
                            </strong>
                          </div>
                        </div>


                        {subscription
                          ?.cancel_at_period_end && (
                          <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-500/[0.07] p-3">
                            <p className="text-xs font-black text-amber-100">
                              {
                                billingCopy.cancellationScheduled
                              }
                            </p>

                            <p className="mt-1 text-xs font-bold leading-5 text-amber-100/45">
                              {
                                billingCopy.cancellationScheduledText
                              }
                            </p>
                          </div>
                        )}


                        {archived && (
                          <p className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-500/[0.07] p-3 text-xs font-bold leading-5 text-amber-100/60">
                            {
                              billingCopy.archivedPaidHint
                            }
                          </p>
                        )}
                      </>
                    )}


                    {/* WAITING */}

                    {waitingForActivation &&
                      !subscriptionActive && (
                        <div className="mt-6 rounded-[22px] border border-[#ff7a00]/20 bg-[#ff7a00]/10 p-4">
                          <div className="flex items-start gap-3">
                            <Loader2
                              size={
                                20
                              }
                              className="mt-0.5 shrink-0 animate-spin text-[#ff8d22]"
                            />

                            <div>
                              <p className="font-black text-[#ffd0a3]">
                                {
                                  billingCopy.confirmingTitle
                                }
                              </p>

                              <p className="mt-1 text-xs font-bold leading-5 text-[#ffd0a3]/50">
                                {
                                  billingCopy.confirmingText
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}


                    {/* PAST DUE + GRACE ACTIVE */}

                    {subscriptionPastDue &&
                      gracePeriodActive && (
                        <>
                          <div className="mt-6 rounded-[22px] border border-amber-400/20 bg-amber-500/[0.07] p-4">
                            <div className="flex items-start gap-3">
                              <CircleAlert
                                size={
                                  20
                                }
                                className="mt-0.5 shrink-0 text-amber-300"
                              />

                              <div className="min-w-0 flex-1">
                                <p className="font-black text-amber-100">
                                  {
                                    billingCopy.pastDueTitle
                                  }
                                </p>

                                <p className="mt-1 text-xs font-bold leading-5 text-amber-100/50">
                                  {archived
                                    ? billingCopy.pastDueGraceArchivedText
                                    : billingCopy.pastDueGraceText}
                                </p>
                              </div>
                            </div>
                          </div>


                          <div className="mt-4 grid gap-3">
                            <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-400/15 bg-black/20 p-4">
                              <span className="text-xs font-black text-white/35">
                                {
                                  billingCopy.gracePeriodEnds
                                }
                              </span>

                              <strong className="text-xs font-black text-amber-200">
                                {gracePeriodEndDate ||
                                  billingCopy.noDate}
                              </strong>
                            </div>


                            {!archived && (
                              <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.05] p-3 text-xs font-black text-emerald-200/70">
                                <CheckCircle2
                                  size={
                                    15
                                  }
                                />

                                {
                                  billingCopy.graceLive
                                }
                              </div>
                            )}
                          </div>
                        </>
                      )}


                    {/* PAST DUE + GRACE EXPIRED */}

                    {subscriptionPastDue &&
                      gracePeriodExpired && (
                        <>
                          <div className="mt-6 rounded-[22px] border border-red-400/20 bg-red-500/[0.07] p-4">
                            <div className="flex items-start gap-3">
                              <CircleAlert
                                size={
                                  20
                                }
                                className="mt-0.5 shrink-0 text-red-300"
                              />

                              <div className="min-w-0 flex-1">
                                <p className="font-black text-red-100">
                                  {
                                    billingCopy.graceExpiredTitle
                                  }
                                </p>

                                <p className="mt-1 text-xs font-bold leading-5 text-red-100/50">
                                  {
                                    billingCopy.graceExpiredText
                                  }
                                </p>
                              </div>
                            </div>
                          </div>


                          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-400/15 bg-red-500/[0.05] p-3 text-xs font-black text-red-200/70">
                            <CircleAlert
                              size={
                                15
                              }
                            />

                            {
                              billingCopy.graceExpired
                            }
                          </div>


                          {gracePeriodEndDate && (
                            <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                              <span className="text-xs font-black text-white/35">
                                {
                                  billingCopy.gracePeriodEnds
                                }
                              </span>

                              <strong className="text-xs font-black text-white/60">
                                {
                                  gracePeriodEndDate
                                }
                              </strong>
                            </div>
                          )}
                        </>
                      )}


                    {/* SUSPENDED */}

                    {subscriptionSuspended && (
                      <div className="mt-6 rounded-[22px] border border-amber-400/20 bg-amber-500/[0.07] p-4">
                        <div className="flex items-start gap-3">
                          <CircleAlert
                            size={
                              20
                            }
                            className="mt-0.5 shrink-0 text-amber-300"
                          />

                          <div>
                            <p className="font-black text-amber-100">
                              {
                                billingCopy.suspendedTitle
                              }
                            </p>

                            <p className="mt-1 text-xs font-bold leading-5 text-amber-100/50">
                              {
                                billingCopy.suspendedText
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}


                    {/* READY / CANCELED / INCOMPLETE */}

                    {!subscriptionActive &&
                      !subscriptionPastDue &&
                      !subscriptionSuspended &&
                      !waitingForActivation && (
                        <>
                          <div className="mt-6">
                            <p className="text-3xl font-black tracking-[-0.05em]">
                              {
                                planPrice
                              }

                              <span className="ms-2 text-sm font-black tracking-normal text-white/35">
                                {
                                  billingCopy.perMonth
                                }
                              </span>
                            </p>


                            <h4 className="mt-5 text-lg font-black">
                              {subscriptionCanceled
                                ? billingCopy.canceledTitle
                                : billingCopy.readyTitle}
                            </h4>


                            <p className="mt-1 text-sm font-bold leading-6 text-white/40">
                              {subscriptionCanceled
                                ? billingCopy.canceledText
                                : billingCopy.readyText}
                            </p>
                          </div>


                          <div className="mt-5 border-t border-white/10 pt-5">
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/30">
                              {
                                billingCopy.included
                              }
                            </p>


                            <div className="mt-4 grid gap-3">
                              {[
                                billingCopy.featureWebsite,
                                billingCopy.featureAddress,
                                billingCopy.featureLanguages,
                                billingCopy.featureUpdates,
                              ].map(
                                (
                                  feature
                                ) => (
                                  <div
                                    key={
                                      feature
                                    }
                                    className="flex items-start gap-2.5"
                                  >
                                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#ff7a00]/10 text-[#ff8d22]">
                                      <Check
                                        size={
                                          12
                                        }
                                        strokeWidth={
                                          3
                                        }
                                      />
                                    </span>

                                    <span className="text-xs font-bold leading-5 text-white/55">
                                      {
                                        feature
                                      }
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>


                          <Button
                            type="button"
                            className="mt-6 w-full"
                            loading={
                              checkoutLoading
                            }
                            loadingText={
                              billingCopy.openingCheckout
                            }
                            disabled={
                              checkoutLoading ||
                              !canStartNewCheckout
                            }
                            onClick={
                              openPaddleCheckout
                            }
                          >
                            <CreditCard
                              size={
                                17
                              }
                            />

                            {subscriptionIncomplete
                              ? billingCopy.continuePayment
                              : billingCopy.publish}
                          </Button>


                          {archived && (
                            <p className="mt-3 text-center text-xs font-bold text-amber-200/50">
                              {
                                billingCopy.restoreFirst
                              }
                            </p>
                          )}
                        </>
                      )}


                    {/* BILLING MANAGEMENT */}

                    {canManageBilling && (
                      <div className="mt-5 border-t border-white/10 pt-5">
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full"
                          loading={
                            portalLoading
                          }
                          loadingText={
                            billingCopy.openingBilling
                          }
                          onClick={
                            openBillingPortal
                          }
                        >
                          <ExternalLink
                            size={
                              16
                            }
                          />

                          {
                            billingCopy.manageBilling
                          }
                        </Button>


                        <p className="mt-2 text-center text-[11px] font-bold leading-5 text-white/25">
                          {
                            billingCopy.manageBillingHint
                          }
                        </p>
                      </div>
                    )}


                    {(subscriptionPastDue ||
                      subscriptionSuspended) && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="mt-3 w-full"
                        onClick={
                          refreshBilling
                        }
                        disabled={
                          subscriptionFetching
                        }
                      >
                        <RefreshCw
                          size={
                            16
                          }
                          className={
                            subscriptionFetching
                              ? "animate-spin"
                              : ""
                          }
                        />

                        {
                          billingCopy.refreshBilling
                        }
                      </Button>
                    )}


                    <div className="mt-5 flex items-center justify-center gap-2 border-t border-white/10 pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-white/25">
                      <ShieldCheck
                        size={
                          13
                        }
                      />

                      {
                        billingCopy.secureBilling
                      }
                    </div>
                  </>
                )}
              </div>
            </Card>


            {/* PAYMENT HISTORY */}

            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/60">
                    <ReceiptText
                      size={
                        18
                      }
                    />
                  </div>


                  <div>
                    <h3 className="text-xl font-black">
                      {
                        billingCopy.paymentHistory
                      }
                    </h3>

                    <p className="mt-1 text-xs font-bold leading-5 text-white/35">
                      {
                        billingCopy.paymentHistoryHint
                      }
                    </p>
                  </div>
                </div>


                {paymentHistoryFetching &&
                  !paymentHistoryLoading && (
                    <Loader2
                      size={
                        16
                      }
                      className="animate-spin text-white/25"
                    />
                  )}
              </div>


              {paymentHistoryLoading ? (
                <div className="mt-5 grid gap-2">
                  <div className="h-16 animate-pulse rounded-2xl bg-white/[0.04]" />

                  <div className="h-16 animate-pulse rounded-2xl bg-white/[0.04]" />
                </div>
              ) : paymentHistoryError ? (
                <div className="mt-5 rounded-2xl border border-red-400/15 bg-red-500/[0.06] p-4 text-xs font-bold leading-5 text-red-100/60">
                  {
                    billingCopy.paymentHistoryFailed
                  }
                </div>
              ) : paymentHistory.length ? (
                <div className="mt-5 overflow-hidden rounded-[22px] border border-white/10 bg-black/20">
                  {paymentHistory
                    .slice(
                      0,
                      6
                    )
                    .map(
                      (
                        payment
                      ) => (
                        <div
                          key={
                            payment.id
                          }
                          className="flex items-center justify-between gap-4 border-b border-white/10 p-4 last:border-b-0"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="size-2 rounded-full bg-emerald-400" />

                              <strong className="text-xs font-black text-white/80">
                                {
                                  billingCopy.paid
                                }
                              </strong>
                            </div>


                            <p className="mt-1 text-[11px] font-bold text-white/30">
                              {formatBillingDate(
                                payment.occurred_at,
                                dir
                              )}
                            </p>
                          </div>


                          <strong
                            dir="ltr"
                            className="shrink-0 text-sm font-black text-white"
                          >
                            {formatPaymentAmount(
                              payment.amount,
                              payment.currency
                            )}
                          </strong>
                        </div>
                      )
                    )}
                </div>
              ) : (
                <div className="mt-5 rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
                  <ReceiptText
                    size={
                      22
                    }
                    className="mx-auto text-white/15"
                  />

                  <p className="mt-3 text-xs font-bold text-white/30">
                    {
                      billingCopy.noPayments
                    }
                  </p>
                </div>
              )}
            </Card>


            {/* WEBSITE VISIBILITY */}

            <Card className="p-5">
              <h3 className="text-xl font-black">
                {
                  billingCopy.visibilityTitle
                }
              </h3>


              <p className="mt-2 text-sm font-bold leading-6 text-white/35">
                {
                  billingCopy.visibilityHint
                }
              </p>


              <Button
                type="button"
                variant={
                  archived
                    ? "secondary"
                    : "danger"
                }
                className="mt-5 w-full"
                loading={
                  changingStatus
                }
                onClick={
                  archiveOrRestore
                }
              >
                {archived ? (
                  <RotateCcw
                    size={
                      16
                    }
                  />
                ) : (
                  <Archive
                    size={
                      16
                    }
                  />
                )}

                {archived
                  ? t(
                      "general.restoreWebsite"
                    )
                  : t(
                      "general.archiveWebsite"
                    )}
              </Button>
            </Card>


            {/* SAVE */}

            <Card className="p-5">
              <h3 className="text-xl font-black">
                {t(
                  "common.save"
                )}
              </h3>


              <Button
                type="submit"
                className="mt-5 w-full"
                loading={
                  saving
                }
                loadingText={t(
                  "common.saving"
                )}
                disabled={
                  !dirty
                }
              >
                <Save
                  size={
                    16
                  }
                />

                {t(
                  "project.saveChanges"
                )}
              </Button>
            </Card>


            {/* DANGER */}

            <Card className="border-red-400/15 bg-red-500/5 p-5">
              <h3 className="text-xl font-black text-red-200">
                {t(
                  "general.dangerZone"
                )}
              </h3>


              <p className="mt-2 text-sm font-bold leading-6 text-red-100/45">
                {t(
                  "general.dangerHint"
                )}
              </p>


              <Button
                type="button"
                variant="danger"
                className="mt-5 w-full"
                loading={
                  deleting
                }
                onClick={
                  deleteProject
                }
              >
                <Trash2
                  size={
                    16
                  }
                />

                {t(
                  "general.deleteWebsite"
                )}
              </Button>
            </Card>
          </aside>
        </div>


        {/* SAVE BAR */}

        {dirty && (
          <div
            className={`fixed bottom-24 left-4 right-4 z-[80] rounded-[24px] border border-white/10 bg-[#111111]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl ${
              dir === "rtl"
                ? "lg:right-[19rem]"
                : "lg:left-[19rem]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-white/70">
                {t(
                  "project.unsaved"
                )}
              </p>


              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setForm(
                      initialForm
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  {t(
                    "common.discard"
                  )}
                </Button>


                <Button
                  type="submit"
                  loading={
                    saving
                  }
                  loadingText={t(
                    "common.saving"
                  )}
                >
                  {t(
                    "project.saveChanges"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </main>
  );
}

