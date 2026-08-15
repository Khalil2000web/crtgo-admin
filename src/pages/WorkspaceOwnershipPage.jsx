import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Crown,
  Image,
  ReceiptText,
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


export default function WorkspaceOwnershipPage() {
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
    transferring,
    setTransferring,
  ] =
    useState(false);

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
    impact,
    setImpact,
  ] =
    useState(null);

  const [
    confirmation,
    setConfirmation,
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


  useEffect(() => {
    if (
      targetUserId
    ) {
      loadImpact(
        targetUserId
      );
    } else {
      setImpact(
        null
      );
    }
  }, [
    targetUserId,
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


      setWorkspace(
        workspaceData
      );

      setMembers(
        memberData ||
          []
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


  async function loadImpact(
    userId
  ) {
    setError(
      ""
    );

    setImpact(
      null
    );


    try {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          "get_workspace_transfer_impact",
          {
            p_workspace_id:
              workspaceId,

            p_target_user_id:
              userId,
          }
        );


      if (
        error
      ) {
        throw error;
      }


      setImpact(
        Array.isArray(
          data
        )
          ? data[0] ||
              null
          : data
      );
    } catch (
      error
    ) {
      handleError(
        error
      );
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


  async function transferOwnership() {
    if (
      transferring ||
      !impact?.can_transfer ||
      !targetUserId ||
      confirmation !==
        workspace?.name
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        `Transfer ownership of ${workspace.name}? This changes who controls the workspace and its projects.`
      );


    if (
      !confirmed
    ) {
      return;
    }


    setTransferring(
      true
    );

    setError(
      ""
    );


    try {
      const {
        error,
      } =
        await supabase.rpc(
          "transfer_workspace_ownership",
          {
            p_workspace_id:
              workspaceId,

            p_target_user_id:
              targetUserId,
          }
        );


      if (
        error
      ) {
        throw error;
      }


      navigate(
        `/workspace/${workspaceId}`,
        {
          replace:
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
      setTransferring(
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


  if (
    loading
  ) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-black/10 border-t-[#ff7a00] dark:border-white/10 dark:border-t-[#ff7a00]" />
      </main>
    );
  }


  return (
    <main className="mx-auto w-full max-w-[1050px] px-5 py-8 md:px-8">
      <Link
        to={`/workspace/${workspaceId}/members`}
        className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-black/40 transition hover:text-[#ff7a00] dark:text-white/35"
      >
        <ArrowLeft
          size={
            13
          }
        />

        Members
      </Link>


      <header className="mt-7 max-w-2xl">
        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#ff7a00]">
          Workspace / Ownership
        </div>


        <h1 className="mt-3 text-4xl font-normal tracking-[-0.045em] text-black dark:text-white md:text-5xl">
          Transfer ownership
        </h1>


        <p className="mt-4 text-sm leading-6 text-black/45 dark:text-white/40">
          Transfer control of{" "}
          <strong className="font-medium text-black dark:text-white">
            {workspace?.name}
          </strong>{" "}
          to another Carter Go account already in this workspace.
        </p>
      </header>


      {error && (
        <div className="mt-8 border-l-2 border-red-500 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {
            error
          }
        </div>
      )}


      <section className="mt-10">
        <div className="flex min-h-9 items-center justify-between border-b border-black/15 font-mono text-[8px] uppercase tracking-[0.08em] text-black/35 dark:border-white/10 dark:text-white/30">
          <span>
            New owner
          </span>

          <span>
            {String(
              candidates.length
            ).padStart(
              2,
              "0"
            )} ELIGIBLE
          </span>
        </div>


        {candidates.length ===
        0 ? (
          <div className="border-b border-black/10 py-8 dark:border-white/10">
            <div className="flex max-w-xl items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center bg-black text-white dark:bg-white dark:text-black">
                <UserRound
                  size={
                    19
                  }
                />
              </div>


              <div>
                <h2 className="text-lg font-normal text-black dark:text-white">
                  Add another member first
                </h2>

                <p className="mt-2 text-xs leading-5 text-black/40 dark:text-white/35">
                  Ownership can only be transferred to an existing member of the workspace.
                </p>


                <Link
                  to={`/workspace/${workspaceId}/members`}
                  className="mt-4 inline-flex h-9 items-center bg-[#ff7a00] px-3 font-mono text-[8px] uppercase tracking-[0.06em] text-black"
                >
                  Manage members
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-b border-black/10 dark:border-white/10">
            {candidates.map(
              (
                member
              ) => {
                const selected =
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
                    onClick={() => {
                      setTargetUserId(
                        member.user_id
                      );

                      setConfirmation(
                        ""
                      );
                    }}
                    className={`flex min-h-[72px] w-full items-center gap-4 border-t border-black/10 px-3 text-left first:border-t-0 dark:border-white/10 ${
                      selected
                        ? "bg-[#ff7a00]/[0.06]"
                        : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center ${
                        selected
                          ? "bg-[#ff7a00] text-black"
                          : "bg-black text-white dark:bg-white dark:text-black"
                      }`}
                    >
                      {selected ? (
                        <Check
                          size={
                            17
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

                      <div className="mt-1 flex gap-3 font-mono text-[8px] text-black/35 dark:text-white/30">
                        {member.username && (
                          <span dir="ltr">
                            @{member.username}
                          </span>
                        )}

                        <span className="uppercase">
                          {
                            member.role
                          }
                        </span>
                      </div>
                    </div>


                    {selected && (
                      <Crown
                        size={
                          17
                        }
                        className="text-[#ff7a00]"
                      />
                    )}
                  </button>
                );
              }
            )}
          </div>
        )}
      </section>


      {targetUserId &&
        impact && (
        <section className="mt-10">
          <div className="flex min-h-9 items-center justify-between border-b border-black/15 font-mono text-[8px] uppercase tracking-[0.08em] text-black/35 dark:border-white/10 dark:text-white/30">
            <span>
              Transfer check
            </span>

            <span>
              {impact.can_transfer
                ? "READY"
                : "BLOCKED"}
            </span>
          </div>


          <div className="border-b border-black/10 dark:border-white/10">
            <ImpactRow
              icon={
                ShieldCheck
              }
              label="Projects"
              value={
                impact.project_count ||
                0
              }
              okay
            />


            <ImpactRow
              icon={
                ReceiptText
              }
              label="Billing records"
              value={
                impact.subscription_count ||
                0
              }
              okay={
                Number(
                  impact.subscription_count ||
                    0
                ) ===
                0
              }
            />


            <ImpactRow
              icon={
                Image
              }
              label="Referenced service assets"
              value={
                impact.referenced_asset_count ||
                0
              }
              okay={
                Number(
                  impact.referenced_asset_count ||
                    0
                ) ===
                0
              }
            />
          </div>
        </section>
      )}


{impact &&
  !impact.can_transfer && (
    <section className="mt-8 flex gap-4 border border-[#ff7a00]/30 bg-[#ff7a00]/[0.04] p-5">
      <AlertTriangle
        size={20}
        className="shrink-0 text-[#ff7a00]"
      />

      <div>
        <h2 className="text-base font-medium text-black dark:text-white">
          Transfer needs preparation
        </h2>

        <p className="mt-2 max-w-2xl text-xs leading-5 text-black/45 dark:text-white/40">
          Carter Go will not transfer ownership while billing records or
          service assets are still tied to the current owner. Those need a
          proper handoff first.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={`/workspace/${workspaceId}/asset-handoff`}
            className="inline-flex h-9 items-center bg-[#ff7a00] px-3 font-mono text-[8px] uppercase text-black"
          >
            Handle service assets
          </Link>

          <Link
            to={`/workspace/${workspaceId}/billing-handoff`}
            className="inline-flex h-9 items-center border border-black/15 px-3 font-mono text-[8px] uppercase text-black dark:border-white/15 dark:text-white"
          >
            Handle billing
          </Link>
        </div>
      </div>
    </section>
  )}



      {impact?.can_transfer && (
        <section className="mt-10 border-t border-black/80 pt-6 dark:border-white/70">
          <div className="max-w-xl">
            <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-red-600 dark:text-red-400">
              Final confirmation
            </span>


            <h2 className="mt-2 text-xl font-normal tracking-[-0.025em] text-black dark:text-white">
              This changes the workspace owner
            </h2>


            <p className="mt-2 text-xs leading-5 text-black/40 dark:text-white/35">
              The new owner will become the owner of the workspace and all projects inside it. Your workspace role will become Admin.
            </p>


            <label className="mt-6 grid gap-2">
              <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-black/40 dark:text-white/35">
                Type {workspace?.name} to confirm
              </span>

              <input
                type="text"
                value={
                  confirmation
                }
                onChange={(
                  event
                ) =>
                  setConfirmation(
                    event.target.value
                  )
                }
                className="h-11 border border-black/15 bg-transparent px-3 text-sm text-black outline-none focus:border-red-500 dark:border-white/10 dark:text-white"
              />
            </label>


            <button
              type="button"
              onClick={
                transferOwnership
              }
              disabled={
                transferring ||
                confirmation !==
                  workspace?.name
              }
              className="mt-4 inline-flex h-10 items-center gap-2 bg-red-600 px-4 font-mono text-[8px] font-medium uppercase tracking-[0.06em] text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Crown
                size={
                  14
                }
              />

              {transferring
                ? "Transferring..."
                : "Transfer ownership"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}


function ImpactRow({
  icon:
    Icon,
  label,
  value,
  okay,
}) {
  return (
    <div className="flex min-h-[58px] items-center gap-3 border-t border-black/10 px-3 first:border-t-0 dark:border-white/10">
      <div
        className={`grid h-8 w-8 place-items-center ${
          okay
            ? "bg-black/[0.05] text-black/45 dark:bg-white/[0.06] dark:text-white/45"
            : "bg-[#ff7a00]/10 text-[#e66e00]"
        }`}
      >
        <Icon
          size={
            15
          }
        />
      </div>


      <span className="flex-1 text-xs text-black/60 dark:text-white/55">
        {
          label
        }
      </span>


      <strong
        className={`font-mono text-[9px] ${
          okay
            ? "text-black/40 dark:text-white/35"
            : "text-[#e66e00]"
        }`}
      >
        {
          value
        }
      </strong>
    </div>
  );
}


function cleanError(
  message
) {
  if (
    message.includes(
      "TARGET_MUST_BE_WORKSPACE_MEMBER"
    )
  ) {
    return "The new owner must already be a member of this workspace.";
  }


  if (
    message.includes(
      "WORKSPACE_BILLING_REQUIRES_HANDOFF"
    )
  ) {
    return "Billing must be handed off before ownership can be transferred.";
  }


  if (
    message.includes(
      "WORKSPACE_ASSETS_REQUIRE_HANDOFF"
    )
  ) {
    return "Service images must be handed off before ownership can be transferred.";
  }


  if (
    message.includes(
      "WORKSPACE_OWNER_REQUIRED"
    )
  ) {
    return "Only the current workspace owner can transfer ownership.";
  }


  if (
    message.includes(
      "INVALID_TRANSFER_TARGET"
    )
  ) {
    return "Choose another Carter Go account as the new owner.";
  }


  return (
    message ||
    "Something went wrong."
  );
}