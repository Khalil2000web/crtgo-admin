import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Image,
  LoaderCircle,
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


export default function WorkspaceAssetHandoffPage() {
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
    result,
    setResult,
  ] =
    useState(null);

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
    setImpact(
      null
    );

    setResult(
      null
    );

    setError(
      ""
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


  async function handoffAssets() {
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

    setResult(
      null
    );


    try {
      const {
        data,
        error,
      } =
        await supabase.functions.invoke(
          "handoff-workspace-assets",
          {
            body: {
              workspaceId,
              targetUserId,
            },
          }
        );


      if (
        error
      ) {
        throw error;
      }


      if (
        data?.error
      ) {
        if (
          data.error ===
          "MFA_REQUIRED"
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


        throw new Error(
          data.error
        );
      }


      setResult(
        data
      );


      await loadImpact(
        targetUserId
      );
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


  const assetsRemaining =
    Number(
      impact
        ?.referenced_asset_count ||
        0
    );


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
          Workspace / Asset handoff
        </div>

        <h1 className="mt-3 text-4xl font-normal tracking-[-0.045em] text-black dark:text-white md:text-5xl">
          Move service assets
        </h1>

        <p className="mt-4 text-sm leading-6 text-black/45 dark:text-white/40">
          Move Menu images away from the
          current account and into the{" "}
          <strong className="font-medium text-black dark:text-white">
            {workspace?.name}
          </strong>{" "}
          workspace itself.
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
            Future owner
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
          <div className="flex items-start gap-4 border-b border-black/10 py-7 dark:border-white/10">
            <div className="grid h-11 w-11 shrink-0 place-items-center bg-black text-white dark:bg-white dark:text-black">
              <UserRound
                size={
                  18
                }
              />
            </div>

            <div>
              <h2 className="text-base font-medium text-black dark:text-white">
                Add another member first
              </h2>

              <p className="mt-2 text-xs leading-5 text-black/40 dark:text-white/35">
                Choose the Carter Go account
                that will receive ownership.
              </p>

              <Link
                to={`/workspace/${workspaceId}/members`}
                className="mt-4 inline-flex h-9 items-center bg-[#ff7a00] px-3 font-mono text-[8px] uppercase text-black"
              >
                Manage members
              </Link>
            </div>
          </div>
        ) : (
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
                        <CheckCircle2
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

                      <div className="mt-1 font-mono text-[8px] uppercase text-black/35 dark:text-white/30">
                        {
                          member.role
                        }
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}
      </section>


      {impact && (
        <section className="mt-10">
          <div className="flex min-h-9 items-center justify-between border-b border-black/15 font-mono text-[8px] uppercase tracking-[0.08em] text-black/35 dark:border-white/10 dark:text-white/30">
            <span>
              Service assets
            </span>

            <span>
              {String(
                assetsRemaining
              ).padStart(
                2,
                "0"
              )} OWNER-BOUND
            </span>
          </div>


          <div className="flex min-h-[86px] items-center gap-4 border-b border-black/10 py-4 dark:border-white/10">
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center ${
                assetsRemaining >
                0
                  ? "bg-[#ff7a00] text-black"
                  : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              <Image
                size={
                  19
                }
              />
            </div>


            <div className="flex-1">
              <strong className="text-sm font-medium text-black dark:text-white">
                Menu service files
              </strong>

              <p className="mt-1 text-xs leading-5 text-black/40 dark:text-white/35">
                {assetsRemaining >
                0
                  ? "These files are still stored under the current owner's account."
                  : "The referenced workspace files are no longer tied to the current owner."}
              </p>
            </div>


            <strong className="font-mono text-sm font-medium text-[#ff7a00]">
              {
                assetsRemaining
              }
            </strong>
          </div>
        </section>
      )}


      {targetUserId &&
        assetsRemaining >
          0 && (
        <section className="mt-8 border border-black/10 p-5 dark:border-white/10">
          <div className="flex items-start gap-4">
            <ShieldCheck
              size={
                20
              }
              className="mt-0.5 shrink-0 text-[#ff7a00]"
            />

            <div className="flex-1">
              <h2 className="text-base font-medium text-black dark:text-white">
                Ready to migrate assets
              </h2>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-black/40 dark:text-white/35">
                Carter Go will copy the referenced
                Menu files into the workspace,
                update project and menu URLs, then
                remove the old copies through the
                Storage API.
              </p>


              <button
                type="button"
                onClick={
                  handoffAssets
                }
                disabled={
                  working
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
                  <Image
                    size={
                      14
                    }
                  />
                )}

                {working
                  ? "Moving assets..."
                  : "Move service assets"}
              </button>
            </div>
          </div>
        </section>
      )}


      {impact &&
        assetsRemaining ===
          0 && (
        <section className="mt-8 flex items-start gap-4 border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
          <CheckCircle2
            size={
              20
            }
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div>
            <h2 className="text-base font-medium text-black dark:text-white">
              Asset handoff complete
            </h2>

            <p className="mt-2 text-xs leading-5 text-black/40 dark:text-white/35">
              Workspace ownership is no longer
              blocked by referenced service
              images.
            </p>

            <Link
              to={`/workspace/${workspaceId}/ownership`}
              className="mt-4 inline-flex h-9 items-center bg-black px-3 font-mono text-[8px] uppercase text-white dark:bg-white dark:text-black"
            >
              Back to ownership
            </Link>
          </div>
        </section>
      )}


      {result?.cleanupWarning && (
        <section className="mt-6 flex gap-3 border border-[#ff7a00]/25 bg-[#ff7a00]/[0.04] p-4">
          <AlertTriangle
            size={
              17
            }
            className="shrink-0 text-[#ff7a00]"
          />

          <p className="text-xs leading-5 text-black/45 dark:text-white/40">
            The new workspace files are active,
            but an old Storage copy could not be
            removed automatically. Running the
            handoff again will retry cleanup.
          </p>
        </section>
      )}
    </main>
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
    return "The future owner must already be a workspace member.";
  }


  if (
    message.includes(
      "WORKSPACE_OWNER_REQUIRED"
    )
  ) {
    return "Only the current workspace owner can hand off service assets.";
  }


  if (
    message.includes(
      "INVALID_TRANSFER_TARGET"
    )
  ) {
    return "Choose another Carter Go account.";
  }


  if (
    message.includes(
      "ASSET_HANDOFF_FAILED"
    )
  ) {
    return "Carter Go could not complete the service asset handoff.";
  }


  return (
    message ||
    "Something went wrong."
  );
}