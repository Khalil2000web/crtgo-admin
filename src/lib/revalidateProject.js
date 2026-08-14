import { supabase } from "./supabase";


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


export async function revalidatePublicProject(
  projectId,
  {
    previousSlug = null,
  } = {}
) {
  const cleanProjectId =
    String(
      projectId ||
        ""
    ).trim();


  if (
    !cleanProjectId
  ) {
    return {
      ok:
        false,

      error:
        "Project ID is required.",
    };
  }


  try {
    const {
      data,
      error,
    } =
      await supabase.functions.invoke(
        "revalidate-public-project",
        {
          body: {
            projectId:
              cleanProjectId,

            ...(previousSlug
              ? {
                  previousSlug:
                    String(
                      previousSlug
                    )
                      .trim()
                      .toLowerCase(),
                }
              : {}),
          },
        }
      );


    if (
      error
    ) {
      const message =
        await getFunctionErrorMessage(
          error,
          "Could not refresh the public website."
        );


      return {
        ok:
          false,

        error:
          message,
      };
    }


    if (
      !data?.revalidated
    ) {
      return {
        ok:
          false,

        error:
          data?.error ||
          "Could not refresh the public website.",
      };
    }


    return {
      ok:
        true,

      slugs:
        Array.isArray(
          data.slugs
        )
          ? data.slugs
          : [],
    };
  } catch (
    error
  ) {
    return {
      ok:
        false,

      error:
        error?.message ||
        "Could not refresh the public website.",
    };
  }
}