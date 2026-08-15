import {
  ArrowLeft,
  Crown,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../lib/supabase";


export default function WorkspaceMembersPage() {
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
    email,
    setEmail,
  ] =
    useState("");

  const [
    role,
    setRole,
  ] =
    useState("member");

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


  async function addMember(
    event
  ) {
    event.preventDefault();


    if (
      working
    ) {
      return;
    }


    const cleanEmail =
      email
        .trim()
        .toLowerCase();


    if (
      !cleanEmail
    ) {
      setError(
        "Enter the Carter Go account email."
      );

      return;
    }


    setWorking(
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
          "add_workspace_member_by_email",
          {
            p_workspace_id:
              workspaceId,

            p_email:
              cleanEmail,

            p_role:
              role,
          }
        );


      if (
        error
      ) {
        throw error;
      }


      setEmail(
        ""
      );

      setRole(
        "member"
      );


      await loadPage();
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


  async function changeRole(
    member,
    nextRole
  ) {
    if (
      working ||
      member.is_owner ||
      member.role ===
        nextRole
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
      const {
        error,
      } =
        await supabase.rpc(
          "update_workspace_member_role",
          {
            p_workspace_id:
              workspaceId,

            p_member_user_id:
              member.user_id,

            p_role:
              nextRole,
          }
        );


      if (
        error
      ) {
        throw error;
      }


      await loadPage();
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


  async function removeMember(
    member
  ) {
    if (
      working ||
      member.is_owner
    ) {
      return;
    }


    const label =
      member.display_name ||
      member.username ||
      member.email ||
      "this member";


    const confirmed =
      window.confirm(
        `Remove ${label} from ${workspace?.name || "this workspace"}?`
      );


    if (
      !confirmed
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
      const {
        error,
      } =
        await supabase.rpc(
          "remove_workspace_member",
          {
            p_workspace_id:
              workspaceId,

            p_member_user_id:
              member.user_id,
          }
        );


      if (
        error
      ) {
        throw error;
      }


      await loadPage();
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
    <main className="mx-auto w-full max-w-[1100px] px-5 py-8 md:px-8">
      <Link
        to={`/workspace/${workspaceId}`}
        className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-black/40 transition hover:text-[#ff7a00] dark:text-white/35"
      >
        <ArrowLeft
          size={
            13
          }
        />

        Workspace
      </Link>


      <header className="mt-7 max-w-2xl">
        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#ff7a00]">
          Workspace / Identity
        </div>

        <h1 className="mt-3 text-4xl font-normal tracking-[-0.045em] text-black dark:text-white md:text-5xl">
          Members
        </h1>

        <p className="mt-4 text-sm leading-6 text-black/45 dark:text-white/40">
          Manage who can access{" "}
          <strong className="font-medium text-black dark:text-white">
            {workspace?.name}
          </strong>
          , and what level of access they have.
        </p>
      </header>


      {error && (
        <div className="mt-7 border-l-2 border-red-500 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {
            error
          }
        </div>
      )}


      <section className="mt-10">
        <div className="flex min-h-9 items-center justify-between border-b border-black/15 font-mono text-[8px] uppercase tracking-[0.08em] text-black/35 dark:border-white/10 dark:text-white/30">
          <span>
            Workspace members
          </span>

          <span>
            {String(
              members.length
            ).padStart(
              2,
              "0"
            )}{" "}
            USERS
          </span>
        </div>


        <div className="border-b border-black/10 dark:border-white/10">
          {members.map(
            (
              member
            ) => (
              <MemberRow
                key={
                  member.user_id
                }
                member={
                  member
                }
                working={
                  working
                }
                onRoleChange={
                  changeRole
                }
                onRemove={
                  removeMember
                }
              />
            )
          )}
        </div>
      </section>


      <section className="mt-12">
        <div className="flex min-h-9 items-center justify-between border-b border-black/15 font-mono text-[8px] uppercase tracking-[0.08em] text-black/35 dark:border-white/10 dark:text-white/30">
          <span>
            Add member
          </span>

          <span>
            CARTER GO ACCOUNT
          </span>
        </div>


        <form
          onSubmit={
            addMember
          }
          className="border-b border-black/10 py-6 dark:border-white/10"
        >
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center bg-[#ff7a00] text-black">
              <UserPlus
                size={
                  19
                }
              />
            </div>


            <div className="w-full max-w-xl">
              <h2 className="text-lg font-normal tracking-[-0.02em] text-black dark:text-white">
                Add an existing Carter Go account
              </h2>

              <p className="mt-1 text-xs leading-5 text-black/40 dark:text-white/35">
                Enter the email attached to their Carter Go account.
              </p>


              <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                <input
                  type="email"
                  value={
                    email
                  }
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="person@example.com"
                  autoComplete="email"
                  dir="ltr"
                  className="h-11 border border-black/15 bg-transparent px-3 text-sm text-black outline-none transition focus:border-[#ff7a00] dark:border-white/10 dark:text-white"
                />


                <select
                  value={
                    role
                  }
                  onChange={(
                    event
                  ) =>
                    setRole(
                      event.target.value
                    )
                  }
                  className="h-11 border border-black/15 bg-transparent px-3 font-mono text-[10px] uppercase text-black outline-none focus:border-[#ff7a00] dark:border-white/10 dark:bg-[#0c0c0c] dark:text-white"
                >
                  <option value="member">
                    Member
                  </option>

                  <option value="admin">
                    Admin
                  </option>
                </select>
              </div>


              <button
                type="submit"
                disabled={
                  working ||
                  !email.trim()
                }
                className="mt-3 inline-flex h-10 items-center gap-2 bg-[#ff7a00] px-4 font-mono text-[9px] font-medium uppercase tracking-[0.06em] text-black transition hover:bg-[#e66e00] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <UserPlus
                  size={
                    14
                  }
                />

                {working
                  ? "Adding..."
                  : "Add member"}
              </button>
            </div>
          </div>
        </form>
      </section>


      <section className="mt-10 flex items-start gap-3 border border-black/10 bg-black/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.025]">
        <ShieldCheck
          size={
            17
          }
          className="mt-0.5 shrink-0 text-[#ff7a00]"
        />

        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-black/45 dark:text-white/40">
            Security
          </div>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-black/40 dark:text-white/35">
            Adding, removing, or changing a workspace member is protected by Carter Go MFA when two-step verification is enabled on the owner's account.
          </p>
        </div>
      </section>
    </main>
  );
}


function MemberRow({
  member,
  working,
  onRoleChange,
  onRemove,
}) {
  const label =
    member.display_name ||
    member.username ||
    member.email ||
    "Carter Go User";


  return (
    <div className="flex min-h-[76px] items-center gap-4 border-t border-black/10 py-3 first:border-t-0 dark:border-white/10">
      <div className="grid h-10 w-10 shrink-0 place-items-center bg-black text-sm text-white dark:bg-white dark:text-black">
        {String(
          label
        )
          .charAt(
            0
          )
          .toUpperCase()}
      </div>


      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <strong className="truncate text-sm font-medium text-black dark:text-white">
            {
              label
            }
          </strong>

          {member.is_owner && (
            <span className="inline-flex items-center gap-1 bg-[#ff7a00]/10 px-1.5 py-1 font-mono text-[7px] uppercase text-[#d66100]">
              <Crown
                size={
                  9
                }
              />

              Owner
            </span>
          )}
        </div>


        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[8px] text-black/35 dark:text-white/30">
          {member.username && (
            <span dir="ltr">
              @{member.username}
            </span>
          )}

          {member.email && (
            <span dir="ltr">
              {
                member.email
              }
            </span>
          )}
        </div>
      </div>


      {member.is_owner ? (
        <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-black/30 dark:text-white/25">
          Owner
        </span>
      ) : (
        <>
          <select
            value={
              member.role
            }
            disabled={
              working
            }
            onChange={(
              event
            ) =>
              onRoleChange(
                member,
                event.target.value
              )
            }
            className="hidden h-9 border border-black/10 bg-transparent px-2 font-mono text-[8px] uppercase text-black outline-none focus:border-[#ff7a00] disabled:opacity-40 dark:border-white/10 dark:bg-[#0b0b0b] dark:text-white sm:block"
          >
            <option value="member">
              Member
            </option>

            <option value="admin">
              Admin
            </option>
          </select>


          <button
            type="button"
            disabled={
              working
            }
            onClick={() =>
              onRemove(
                member
              )
            }
            className="grid h-9 w-9 place-items-center border border-black/10 text-black/35 transition hover:border-red-400 hover:bg-red-500/5 hover:text-red-600 disabled:opacity-35 dark:border-white/10 dark:text-white/30 dark:hover:text-red-300"
            aria-label="Remove member"
          >
            <Trash2
              size={
                14
              }
            />
          </button>
        </>
      )}
    </div>
  );
}


function cleanError(
  message
) {
  if (
    message.includes(
      "CARTER_GO_ACCOUNT_NOT_FOUND"
    )
  ) {
    return "No Carter Go account was found with that email.";
  }


  if (
    message.includes(
      "CANNOT_ADD_SELF"
    )
  ) {
    return "You're already the owner of this workspace.";
  }


  if (
    message.includes(
      "WORKSPACE_OWNER_REQUIRED"
    )
  ) {
    return "Only the workspace owner can manage members.";
  }


  if (
    message.includes(
      "WORKSPACE_MEMBER_NOT_FOUND"
    )
  ) {
    return "That workspace member could not be found.";
  }


  return (
    message ||
    "Something went wrong."
  );
}