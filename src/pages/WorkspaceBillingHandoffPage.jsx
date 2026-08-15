import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  supabase,
} from "../lib/supabase";


export default function WorkspaceBillingHandoffPage() {
  const {
    workspaceId,
  } =
    useParams();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    working,
    setWorking,
  ] =
    useState(false);

  const [
    currentUser,
    setCurrentUser,
  ] =
    useState(null);

  const [
    workspace,
    setWorkspace,
  ] =
    useState(null);

  const [
    members,
    setMembers,
  ] =
    useState([]);

  const [
    targetUserId,
    setTargetUserId,
  ] =
    useState("");

  const [
    handoff,
    setHandoff,
  ] =
    useState(null);

  const [
    target,
    setTarget,
  ] =
    useState(null);

  const [
    subscriptions,
    setSubscriptions,
  ] =
    useState([]);

  const [
    transactions,
    setTransactions,
  ] =
    useState([]);

  const [
    callerRole,
    setCallerRole,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");


  useEffect(() => {
    loadPage();
  }, [
    workspaceId,
  ]);


  async function loadPage() {
    setLoading(
      true
    );

    setError(
      ""
    );


    try {
      const {
        data:
          userData,

        error:
          userError,
      } =
        await supabase.auth
          .getUser();


      if (
        userError
      ) {
        throw userError;
      }


      if (
        !userData.user
      ) {
        navigate(
          "/login",
          {
            replace:
              true,
          }
        );

        return;
      }


      setCurrentUser(
        userData.user
      );


      const {
        data:
          workspaceData,

        error:
          workspaceError,
      } =
        await supabase
          .from(
            "workspaces"
          )
          .select(`
            id,
            name,
            owner_id
          `)
          .eq(
            "id",
            workspaceId
          )
          .single();


      if (
        workspaceError
      ) {
        throw workspaceError;
      }


      setWorkspace(
        workspaceData
      );


      const isOwner =
        workspaceData.owner_id ===
        userData.user.id;


      /*
       * Only the current owner needs
       * the full member-management list.
       */
      if (
        isOwner
      ) {
        const {
          data:
            memberData,

          error:
            memberError,
        } =
          await supabase.rpc(
            "get_workspace_members_for_management",
            {
              p_workspace_id:
                workspaceId,
            }
          );


        if (
          memberError
        ) {
          throw memberError;
        }


        setMembers(
          memberData ||
            []
        );
      }


      await loadHandoff(
        {
          quietIfMissing:
            true,
        }
      );
    } catch (
      error
    ) {
      handleError(
        error
      );
    } finally {
      setLoading(
        false
      );
    }
  }


  async function invokeBilling(
    body
  ) {
    const {
      data,
      error,
    } =
      await supabase.functions
        .invoke(
          "workspace-billing-handoff",
          {
            body,
          }
        );


    if (
      !error
    ) {
      return data;
    }


    let payload =
      null;


    try {
      payload =
        await error.context
          ?.json?.();
    } catch {
      payload =
        null;
    }


    throw new Error(
      payload?.error ||
        error.message ||
        "BILLING_HANDOFF_FAILED"
    );
  }


  async function loadHandoff({
    quietIfMissing =
      false,
  } = {}) {
    try {
      const data =
        await invokeBilling({
          action:
            "status",

          workspaceId,
        });


      setHandoff(
        data?.handoff ||
          null
      );

      setTarget(
        data?.target ||
          null
      );

      setSubscriptions(
        data?.subscriptions ||
          []
      );

      setTransactions(
        data?.handoff
          ?.payment_transactions ||
          []
      );

      setCallerRole(
        data?.callerRole ||
          ""
      );


      if (
        data?.handoff
          ?.to_user_id
      ) {
        setTargetUserId(
          data.handoff
            .to_user_id
        );
      }


      return data;
    } catch (
      error
    ) {
      if (
        quietIfMissing
      ) {
        return null;
      }


      throw error;
    }
  }


  function handleError(
    error
  ) {
    const message =
      String(
        error?.message ||
          ""
      );


    if (
      message.includes(
        "MFA_REQUIRED"
      )
    ) {
      navigate(
        "/mfa",
        {
          replace:
            true,

          state: {
            from:
              `${location.pathname}${location.search}`,
          },
        }
      );

      return;
    }


    console.error(
      error
    );


    setError(
      cleanError(
        message
      )
    );
  }


  async function prepareHandoff() {
    if (
      working ||
      !targetUserId
    ) {
      return;
    }


    setWorking(
      true
    );

    setError(
      ""
    );


    try {
      await invokeBilling({
        action:
          "prepare",

        workspaceId,

        targetUserId,
      });


      await loadHandoff();
    } catch (
      error
    ) {
      handleError(
        error
      );
    } finally {
      setWorking(
        false
      );
    }
  }


  async function acceptHandoff() {
    if (
      working
    ) {
      return;
    }


    setWorking(
      true
    );

    setError(
      ""
    );


    try {
      const data =
        await invokeBilling({
          action:
            "accept",

          workspaceId,
        });


      setTransactions(
        data?.transactions ||
          []
      );


      await loadHandoff();


      const firstCheckout =
        (
          data?.transactions ||
          []
        ).find(
          (
            transaction
          ) =>
            transaction
              ?.checkoutUrl
        );


      if (
        firstCheckout
          ?.checkoutUrl
      ) {
        window.open(
          firstCheckout.checkoutUrl,
          "_blank",
          "noopener,noreferrer"
        );
      }
    } catch (
      error
    ) {
      handleError(
        error
      );
    } finally {
      setWorking(
        false
      );
    }
  }


  async function verifyPaymentSetup() {
    if (
      working
    ) {
      return;
    }


    setWorking(
      true
    );

    setError(
      ""
    );


    try {
      const data =
        await invokeBilling({
          action:
            "verify",

          workspaceId,
        });


      setTransactions(
        data?.transactions ||
          []
      );


      await loadHandoff();
    } catch (
      error
    ) {
      handleError(
        error
      );
    } finally {
      setWorking(
        false
      );
    }
  }


  const candidates =
    useMemo(
      () =>
        members.filter(
          (
            member
          ) =>
            !member.is_owner
        ),
      [
        members,
      ]
    );


  const isOwner =
    workspace &&
    currentUser &&
    workspace.owner_id ===
      currentUser.id;


  const isTarget =
    currentUser &&
    handoff &&
    handoff.to_user_id ===
      currentUser.id;


  if (
    loading
  ) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle
          size={
            30
          }
          className="animate-spin text-[#ff7a00]"
        />
      </main>
    );
  }


  return (
    <main className="mx-auto w-full max-w-[1050px] px-5 py-8 md:px-8">
      <Link
        to={`/workspace/${workspaceId}/ownership`}
        className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-black/40 transition hover:text-[#ff7a00] dark:text-white/35"
      >
        <ArrowLeft
          size={
            13
          }
        />

        Ownership
      </Link>


      <header className="mt-7 max-w-2xl">
        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#ff7a00]">
          Workspace / Billing handoff
        </div>


        <h1 className="mt-3 text-4xl font-normal tracking-[-0.045em] text-black dark:text-white md:text-5xl">
          Transfer billing
        </h1>


        <p className="mt-4 text-sm leading-6 text-black/45 dark:text-white/40">
          Move billing responsibility for{" "}
          <strong className="font-medium text-black dark:text-white">
            {workspace?.name}
          </strong>{" "}
          to the Carter Go account that
          will become the new owner.
        </p>
      </header>


      {error && (
        <div className="mt-8 border-l-2 border-red-500 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {
            error
          }
        </div>
      )}


      {isOwner &&
        !handoff && (
        <OwnerPrepare
          candidates={
            candidates
          }
          targetUserId={
            targetUserId
          }
          setTargetUserId={
            setTargetUserId
          }
          working={
            working
          }
          prepareHandoff={
            prepareHandoff
          }
          workspaceId={
            workspaceId
          }
        />
      )}


      {isOwner &&
        handoff && (
        <OwnerStatus
          handoff={
            handoff
          }
          target={
            target
          }
          subscriptions={
            subscriptions
          }
          workspaceId={
            workspaceId
          }
          working={
            working
          }
          refresh={() =>
            loadHandoff()
          }
        />
      )}


      {isTarget && (
        <TargetStatus
          handoff={
            handoff
          }
          transactions={
            transactions
          }
          subscriptions={
            subscriptions
          }
          working={
            working
          }
          acceptHandoff={
            acceptHandoff
          }
          verifyPaymentSetup={
            verifyPaymentSetup
          }
          workspaceId={
            workspaceId
          }
        />
      )}


      {!isOwner &&
        !isTarget && (
        <section className="mt-10 border border-black/10 p-6 dark:border-white/10">
          <UserRound
            size={
              20
            }
            className="text-[#ff7a00]"
          />

          <h2 className="mt-4 text-lg font-medium text-black dark:text-white">
            No billing handoff for this account
          </h2>

          <p className="mt-2 text-xs leading-5 text-black/40 dark:text-white/35">
            A workspace owner must choose
            your Carter Go account as the
            future owner before billing can
            be transferred.
          </p>
        </section>
      )}


      <section className="mt-10 flex items-start gap-3 border border-black/10 bg-black/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.025]">
        <ShieldCheck
          size={
            17
          }
          className="mt-0.5 shrink-0 text-[#ff7a00]"
        />

        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-black/45 dark:text-white/40">
            Billing security
          </div>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-black/40 dark:text-white/35">
            The current owner's payment
            method is never handed to the
            new owner. The future owner
            supplies their own payment
            details before ownership can
            change.
          </p>
        </div>
      </section>
    </main>
  );
}


function OwnerPrepare({
  candidates,
  targetUserId,
  setTargetUserId,
  working,
  prepareHandoff,
  workspaceId,
}) {
  return (
    <section className="mt-10">
      <div className="flex min-h-9 items-center justify-between border-b border-black/15 font-mono text-[8px] uppercase tracking-[0.08em] text-black/35 dark:border-white/10 dark:text-white/30">
        <span>
          Future billing owner
        </span>

        <span>
          {String(
            candidates.length
          ).padStart(
            2,
            "0"
          )} MEMBERS
        </span>
      </div>


      {candidates.length ===
      0 ? (
        <div className="border-b border-black/10 py-7 dark:border-white/10">
          <p className="text-sm text-black/50 dark:text-white/40">
            Add another Carter Go account
            to this workspace first.
          </p>

          <Link
            to={`/workspace/${workspaceId}/members`}
            className="mt-4 inline-flex h-9 items-center bg-[#ff7a00] px-3 font-mono text-[8px] uppercase text-black"
          >
            Manage members
          </Link>
        </div>
      ) : (
        <>
          <div className="border-b border-black/10 dark:border-white/10">
            {candidates.map(
              (
                member
              ) => {
                const active =
                  member.user_id ===
                  targetUserId;

                const label =
                  member.display_name ||
                  member.username ||
                  member.email ||
                  "Carter Go User";


                return (
                  <button
                    key={
                      member.user_id
                    }
                    type="button"
                    onClick={() =>
                      setTargetUserId(
                        member.user_id
                      )
                    }
                    className={`flex min-h-[68px] w-full items-center gap-4 border-t border-black/10 px-3 text-left first:border-t-0 dark:border-white/10 ${
                      active
                        ? "bg-[#ff7a00]/[0.06]"
                        : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center ${
                        active
                          ? "bg-[#ff7a00] text-black"
                          : "bg-black text-white dark:bg-white dark:text-black"
                      }`}
                    >
                      {active ? (
                        <Check
                          size={
                            16
                          }
                        />
                      ) : (
                        String(
                          label
                        )
                          .charAt(
                            0
                          )
                          .toUpperCase()
                      )}
                    </div>


                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-sm font-medium text-black dark:text-white">
                        {
                          label
                        }
                      </strong>

                      <span className="mt-1 block font-mono text-[8px] uppercase text-black/35 dark:text-white/30">
                        {
                          member.role
                        }
                      </span>
                    </div>
                  </button>
                );
              }
            )}
          </div>


          <button
            type="button"
            disabled={
              working ||
              !targetUserId
            }
            onClick={
              prepareHandoff
            }
            className="mt-5 inline-flex h-10 items-center gap-2 bg-[#ff7a00] px-4 font-mono text-[8px] font-medium uppercase tracking-[0.06em] text-black transition hover:bg-[#e66e00] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {working ? (
              <LoaderCircle
                size={
                  14
                }
                className="animate-spin"
              />
            ) : (
              <CreditCard
                size={
                  14
                }
              />
            )}

            Prepare billing handoff
          </button>
        </>
      )}
    </section>
  );
}


function OwnerStatus({
  handoff,
  target,
  subscriptions,
  workspaceId,
  working,
  refresh,
}) {
  const label =
    target?.display_name ||
    target?.username ||
    target?.email ||
    "Future owner";


  const ready =
    handoff.status ===
    "ready";


  return (
    <section className="mt-10">
      <SectionHeader
        left="Billing handoff"
        right={
          handoff.status
        }
      />


      <div className="border-b border-black/10 dark:border-white/10">
        <StatusRow
          icon={
            UserRound
          }
          title={
            label
          }
          description="Future workspace owner"
          okay
        />

        <StatusRow
          icon={
            CreditCard
          }
          title={`${subscriptions.length} subscription${
            subscriptions.length ===
            1
              ? ""
              : "s"
          }`}
          description={
            ready
              ? "Billing responsibility has been accepted."
              : handoff.status ===
                  "payment_required"
                ? "Waiting for the new owner to finish payment setup."
                : "Waiting for the new owner to accept billing."
          }
          okay={
            ready
          }
        />
      </div>


      {ready ? (
        <div className="mt-6 flex items-start gap-4 border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
          <CheckCircle2
            size={
              20
            }
            className="shrink-0 text-emerald-600"
          />

          <div>
            <h2 className="text-base font-medium text-black dark:text-white">
              Billing handoff complete
            </h2>

            <p className="mt-2 text-xs leading-5 text-black/40 dark:text-white/35">
              You can now return to the
              ownership page and finish the
              workspace transfer.
            </p>

            <Link
              to={`/workspace/${workspaceId}/ownership`}
              className="mt-4 inline-flex h-9 items-center bg-black px-3 font-mono text-[8px] uppercase text-white dark:bg-white dark:text-black"
            >
              Continue ownership transfer
            </Link>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={
            working
          }
          onClick={
            refresh
          }
          className="mt-5 inline-flex h-9 items-center gap-2 border border-black/10 px-3 font-mono text-[8px] uppercase text-black/55 transition hover:border-[#ff7a00] dark:border-white/10 dark:text-white/45"
        >
          <RefreshCw
            size={
              13
            }
          />

          Refresh status
        </button>
      )}
    </section>
  );
}


function TargetStatus({
  handoff,
  transactions,
  subscriptions,
  working,
  acceptHandoff,
  verifyPaymentSetup,
  workspaceId,
}) {
  const ready =
    handoff.status ===
    "ready";

  const paymentRequired =
    handoff.status ===
    "payment_required";


  return (
    <section className="mt-10">
      <SectionHeader
        left="Billing responsibility"
        right={
          handoff.status
        }
      />


      {handoff.status ===
        "pending" && (
        <div className="border-b border-black/10 py-7 dark:border-white/10">
          <div className="flex max-w-2xl items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center bg-[#ff7a00] text-black">
              <CreditCard
                size={
                  19
                }
              />
            </div>

            <div>
              <h2 className="text-lg font-normal text-black dark:text-white">
                Accept billing responsibility
              </h2>

              <p className="mt-2 text-xs leading-5 text-black/40 dark:text-white/35">
                You have been selected as
                the future owner of this
                workspace. Carter Go will
                move its existing Paddle
                subscription to your billing
                identity, then ask you for a
                payment method.
              </p>


              <button
                type="button"
                disabled={
                  working
                }
                onClick={
                  acceptHandoff
                }
                className="mt-5 inline-flex h-10 items-center gap-2 bg-[#ff7a00] px-4 font-mono text-[8px] font-medium uppercase tracking-[0.06em] text-black disabled:opacity-35"
              >
                {working ? (
                  <LoaderCircle
                    size={
                      14
                    }
                    className="animate-spin"
                  />
                ) : (
                  <CreditCard
                    size={
                      14
                    }
                  />
                )}

                Accept & set up payment
              </button>
            </div>
          </div>
        </div>
      )}


      {paymentRequired && (
        <div className="border-b border-black/10 py-7 dark:border-white/10">
          <h2 className="text-lg font-normal text-black dark:text-white">
            Add your payment method
          </h2>

          <p className="mt-2 max-w-xl text-xs leading-5 text-black/40 dark:text-white/35">
            Complete the Paddle payment
            setup for every subscription
            below, then come back here and
            verify it.
          </p>


          <div className="mt-5 grid gap-2">
            {transactions.map(
              (
                transaction,
                index
              ) => (
                <div
                  key={
                    transaction.transactionId ||
                    index
                  }
                  className="flex min-h-[58px] items-center gap-3 border border-black/10 px-3 dark:border-white/10"
                >
                  <CreditCard
                    size={
                      15
                    }
                    className="text-[#ff7a00]"
                  />

                  <div className="flex-1">
                    <strong className="text-xs font-medium text-black dark:text-white">
                      Subscription{" "}
                      {index +
                        1}
                    </strong>

                    <span className="ml-2 font-mono text-[8px] uppercase text-black/30 dark:text-white/25">
                      {transaction.status ||
                        "READY"}
                    </span>
                  </div>


                  {transaction.checkoutUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          transaction.checkoutUrl,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="inline-flex h-8 items-center gap-1.5 bg-black px-2.5 font-mono text-[7px] uppercase text-white dark:bg-white dark:text-black"
                    >
                      Payment setup

                      <ExternalLink
                        size={
                          11
                        }
                      />
                    </button>
                  )}
                </div>
              )
            )}
          </div>


          <button
            type="button"
            disabled={
              working
            }
            onClick={
              verifyPaymentSetup
            }
            className="mt-5 inline-flex h-10 items-center gap-2 bg-[#ff7a00] px-4 font-mono text-[8px] font-medium uppercase tracking-[0.06em] text-black disabled:opacity-35"
          >
            {working ? (
              <LoaderCircle
                size={
                  14
                }
                className="animate-spin"
              />
            ) : (
              <RefreshCw
                size={
                  14
                }
              />
            )}

            Check payment setup
          </button>
        </div>
      )}


      {ready && (
        <div className="mt-1 flex items-start gap-4 border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
          <CheckCircle2
            size={
              20
            }
            className="shrink-0 text-emerald-600"
          />

          <div>
            <h2 className="text-base font-medium text-black dark:text-white">
              Your billing setup is ready
            </h2>

            <p className="mt-2 text-xs leading-5 text-black/40 dark:text-white/35">
              The current workspace owner
              can now complete the ownership
              transfer.
            </p>

            <Link
              to={`/workspace/${workspaceId}`}
              className="mt-4 inline-flex h-9 items-center bg-black px-3 font-mono text-[8px] uppercase text-white dark:bg-white dark:text-black"
            >
              Workspace
            </Link>
          </div>
        </div>
      )}


      {subscriptions.length >
        0 && (
        <p className="mt-5 font-mono text-[8px] uppercase tracking-[0.06em] text-black/30 dark:text-white/25">
          {subscriptions.length} BILLING
          SUBSCRIPTION
          {subscriptions.length ===
          1
            ? ""
            : "S"}
        </p>
      )}
    </section>
  );
}


function SectionHeader({
  left,
  right,
}) {
  return (
    <div className="flex min-h-9 items-center justify-between border-b border-black/15 font-mono text-[8px] uppercase tracking-[0.08em] text-black/35 dark:border-white/10 dark:text-white/30">
      <span>
        {
          left
        }
      </span>

      <span>
        {
          right
        }
      </span>
    </div>
  );
}


function StatusRow({
  icon:
    Icon,
  title,
  description,
  okay,
}) {
  return (
    <div className="flex min-h-[70px] items-center gap-4 border-t border-black/10 px-3 first:border-t-0 dark:border-white/10">
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center ${
          okay
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-[#ff7a00]/10 text-[#e66e00]"
        }`}
      >
        <Icon
          size={
            16
          }
        />
      </div>


      <div className="flex-1">
        <strong className="text-sm font-medium text-black dark:text-white">
          {
            title
          }
        </strong>

        <p className="mt-1 text-xs text-black/40 dark:text-white/35">
          {
            description
          }
        </p>
      </div>


      {okay && (
        <Check
          size={
            15
          }
          className="text-emerald-600"
        />
      )}
    </div>
  );
}


function cleanError(
  message
) {
  if (
    message.includes(
      "WORKSPACE_ASSETS_REQUIRE_HANDOFF"
    )
  ) {
    return "Move the workspace service assets before starting the billing handoff.";
  }


  if (
    message.includes(
      "TARGET_MUST_BE_WORKSPACE_MEMBER"
    )
  ) {
    return "The future owner must already be a workspace member.";
  }


  if (
    message.includes(
      "BILLING_HANDOFF_ALREADY_IN_PROGRESS"
    )
  ) {
    return "A billing handoff is already in progress for another account.";
  }


  if (
    message.includes(
      "BILLING_HANDOFF_TARGET_REQUIRED"
    )
  ) {
    return "Only the selected future owner can accept this billing handoff.";
  }


  if (
    message.includes(
      "PADDLE_HANDOFF_FAILED"
    )
  ) {
    return "Paddle could not complete the billing handoff. Check the Paddle API permissions and try again.";
  }


  if (
    message.includes(
      "WORKSPACE_OWNER_REQUIRED"
    )
  ) {
    return "Only the current workspace owner can start this billing handoff.";
  }


  return (
    message ||
    "Something went wrong."
  );
}