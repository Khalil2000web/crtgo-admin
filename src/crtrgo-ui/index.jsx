import {
  forwardRef,
} from "react";

import {
  ArrowRight,
  Check,
} from "lucide-react";

import "./theme.css";


function cx(
  ...values
) {
  return values
    .filter(Boolean)
    .join(" ");
}


export function CRTRGOTheme({
  children,
  theme = "light",
  dir = "ltr",
  className = "",
}) {
  return (
    <div
      className={cx(
        "crtrgo-ui cg-page",
        className
      )}
      data-theme={theme}
      dir={dir}
    >
      {children}
    </div>
  );
}


export function Container({
  children,
  className = "",
}) {
  return (
    <div
      className={cx(
        "cg-container",
        className
      )}
    >
      {children}
    </div>
  );
}


export function Section({
  children,
  className = "",
}) {
  return (
    <section
      className={cx(
        "cg-section",
        className
      )}
    >
      {children}
    </section>
  );
}


export function Stack({
  children,
  gap = 16,
  className = "",
}) {
  return (
    <div
      className={className}
      style={{
        display:
          "grid",

        gap,
      }}
    >
      {children}
    </div>
  );
}


export function Row({
  children,
  gap = 12,
  wrap = true,
  className = "",
  style = {},
}) {
  return (
    <div
      className={className}
      style={{
        display:
          "flex",

        alignItems:
          "center",

        gap,

        flexWrap:
          wrap
            ? "wrap"
            : "nowrap",

        ...style,
      }}
    >
      {children}
    </div>
  );
}


export function Card({
  children,
  className = "",
  style = {},
}) {
  return (
    <div
      className={className}
      style={{
        border:
          "1px solid var(--cg-border)",

        borderRadius:
          "var(--cg-radius-lg)",

        background:
          "var(--cg-surface)",

        boxShadow:
          "var(--cg-shadow-sm)",

        ...style,
      }}
    >
      {children}
    </div>
  );
}


export function CardBody({
  children,
  className = "",
}) {
  return (
    <div
      className={className}
      style={{
        padding:
          22,
      }}
    >
      {children}
    </div>
  );
}


export const Button =
  forwardRef(
    function Button(
      {
        children,
        variant = "primary",
        size = "md",
        loading = false,
        disabled = false,
        className = "",
        ...props
      },
      ref
    ) {
      const styles = {
        primary: {
          background:
            "var(--cg-accent)",

          color:
            "#111",

          border:
            "1px solid transparent",
        },

        secondary: {
          background:
            "var(--cg-surface)",

          color:
            "var(--cg-text)",

          border:
            "1px solid var(--cg-border-strong)",
        },

        ghost: {
          background:
            "transparent",

          color:
            "var(--cg-text-secondary)",

          border:
            "1px solid transparent",
        },

        danger: {
          background:
            "var(--cg-danger)",

          color:
            "#fff",

          border:
            "1px solid transparent",
        },
      };


      const sizes = {
        sm: {
          minHeight:
            36,

          padding:
            "7px 13px",

          fontSize:
            13,
        },

        md: {
          minHeight:
            42,

          padding:
            "9px 16px",

          fontSize:
            14,
        },

        lg: {
          minHeight:
            48,

          padding:
            "11px 19px",

          fontSize:
            15,
        },
      };


      return (
        <button
          ref={ref}
          disabled={
            disabled ||
            loading
          }
          className={cx(
            "cg-focus",
            className
          )}
          style={{
            display:
              "inline-flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            gap:
              8,

            borderRadius:
              "var(--cg-radius-md)",

            fontWeight:
              750,

            cursor:
              disabled ||
              loading
                ? "not-allowed"
                : "pointer",

            opacity:
              disabled
                ? 0.5
                : 1,

            transition:
              "transform 150ms ease, opacity 150ms ease, background 150ms ease",

            ...styles[
              variant
            ],

            ...sizes[
              size
            ],
          }}
          {...props}
        >
          {loading
            ? "Loading..."
            : children}
        </button>
      );
    }
  );


export function Badge({
  children,
  tone = "neutral",
}) {
  const tones = {
    neutral: {
      background:
        "var(--cg-surface-soft)",

      color:
        "var(--cg-text-secondary)",
    },

    accent: {
      background:
        "var(--cg-accent-soft)",

      color:
        "var(--cg-accent)",
    },

    success: {
      background:
        "rgba(22, 135, 84, 0.1)",

      color:
        "var(--cg-success)",
    },

    warning: {
      background:
        "rgba(183, 107, 0, 0.1)",

      color:
        "var(--cg-warning)",
    },

    danger: {
      background:
        "rgba(214, 61, 61, 0.1)",

      color:
        "var(--cg-danger)",
    },
  };


  return (
    <span
      style={{
        display:
          "inline-flex",

        alignItems:
          "center",

        gap:
          6,

        minHeight:
          26,

        padding:
          "4px 9px",

        borderRadius:
          999,

        fontSize:
          11,

        fontWeight:
          800,

        ...tones[
          tone
        ],
      }}
    >
      {children}
    </span>
  );
}


export function Field({
  label,
  hint,
  children,
}) {
  return (
    <label
      style={{
        display:
          "grid",

        gap:
          7,
      }}
    >
      <span
        style={{
          fontSize:
            13,

          fontWeight:
            750,

          color:
            "var(--cg-text)",
        }}
      >
        {label}
      </span>

      {children}

      {hint && (
        <span
          style={{
            fontSize:
              12,

            lineHeight:
              1.5,

            color:
              "var(--cg-text-muted)",
          }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}


export const Input =
  forwardRef(
    function Input(
      {
        className = "",
        ...props
      },
      ref
    ) {
      return (
        <input
          ref={ref}
          className={cx(
            "cg-focus",
            className
          )}
          style={{
            width:
              "100%",

            minHeight:
              44,

            border:
              "1px solid var(--cg-border-strong)",

            borderRadius:
              "var(--cg-radius-md)",

            padding:
              "10px 13px",

            background:
              "var(--cg-surface)",

            color:
              "var(--cg-text)",

            outline:
              "none",
          }}
          {...props}
        />
      );
    }
  );


export const Textarea =
  forwardRef(
    function Textarea(
      {
        className = "",
        ...props
      },
      ref
    ) {
      return (
        <textarea
          ref={ref}
          className={cx(
            "cg-focus",
            className
          )}
          style={{
            width:
              "100%",

            minHeight:
              110,

            resize:
              "vertical",

            border:
              "1px solid var(--cg-border-strong)",

            borderRadius:
              "var(--cg-radius-md)",

            padding:
              13,

            background:
              "var(--cg-surface)",

            color:
              "var(--cg-text)",

            outline:
              "none",
          }}
          {...props}
        />
      );
    }
  );


export function Avatar({
  name = "C",
  src = null,
  size = 42,
}) {
  const initial =
    String(
      name ||
      "C"
    )
      .trim()
      .charAt(0)
      .toUpperCase();


  return (
    <div
      style={{
        width:
          size,

        height:
          size,

        flex:
          `0 0 ${size}px`,

        display:
          "grid",

        placeItems:
          "center",

        overflow:
          "hidden",

        borderRadius:
          "50%",

        background:
          "var(--cg-accent)",

        color:
          "#111",

        fontSize:
          Math.max(
            12,
            size *
              0.35
          ),

        fontWeight:
          850,
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          style={{
            width:
              "100%",

            height:
              "100%",

            objectFit:
              "cover",
          }}
        />
      ) : (
        initial
      )}
    </div>
  );
}


export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action = null,
}) {
  return (
    <div
      style={{
        paddingBlock:
          24,

        borderBottom:
          "1px solid var(--cg-border)",

        background:
          "var(--cg-surface)",
      }}
    >
      <Container>
        <div
          style={{
            display:
              "flex",

            alignItems:
              "flex-start",

            justifyContent:
              "space-between",

            gap:
              20,
          }}
        >
          <div>
            {eyebrow && (
              <p
                style={{
                  margin:
                    0,

                  fontSize:
                    11,

                  fontWeight:
                    850,

                  letterSpacing:
                    "0.1em",

                  textTransform:
                    "uppercase",

                  color:
                    "var(--cg-accent)",
                }}
              >
                {eyebrow}
              </p>
            )}

            <h1
              style={{
                margin:
                  eyebrow
                    ? "6px 0 0"
                    : 0,

                fontSize:
                  "clamp(28px, 4vw, 42px)",

                lineHeight:
                  1.05,

                letterSpacing:
                  "-0.045em",

                fontWeight:
                  850,
              }}
            >
              {title}
            </h1>

            {subtitle && (
              <p
                style={{
                  maxWidth:
                    650,

                  margin:
                    "9px 0 0",

                  lineHeight:
                    1.6,

                  fontSize:
                    14,

                  color:
                    "var(--cg-text-secondary)",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {action}
        </div>
      </Container>
    </div>
  );
}


export function Tabs({
  items,
  value,
  onChange,
}) {
  return (
    <div
      style={{
        display:
          "flex",

        gap:
          4,

        padding:
          4,

        overflowX:
          "auto",

        border:
          "1px solid var(--cg-border)",

        borderRadius:
          "var(--cg-radius-md)",

        background:
          "var(--cg-surface-soft)",
      }}
    >
      {items.map(
        (
          item
        ) => {
          const active =
            value ===
            item.value;


          return (
            <button
              key={
                item.value
              }
              type="button"
              onClick={() =>
                onChange?.(
                  item.value
                )
              }
              className="cg-focus"
              style={{
                minHeight:
                  36,

                padding:
                  "7px 13px",

                border:
                  0,

                borderRadius:
                  12,

                background:
                  active
                    ? "var(--cg-surface)"
                    : "transparent",

                boxShadow:
                  active
                    ? "var(--cg-shadow-sm)"
                    : "none",

                color:
                  active
                    ? "var(--cg-text)"
                    : "var(--cg-text-muted)",

                fontSize:
                  13,

                fontWeight:
                  750,

                cursor:
                  "pointer",
              }}
            >
              {
                item.label
              }
            </button>
          );
        }
      )}
    </div>
  );
}


export function SettingRow({
  icon,
  title,
  description,
  action,
}) {
  return (
    <div
      style={{
        display:
          "flex",

        alignItems:
          "center",

        gap:
          14,

        padding:
          "17px 0",

        borderBottom:
          "1px solid var(--cg-border)",
      }}
    >
      {icon && (
        <div
          style={{
            width:
              40,

            height:
              40,

            flex:
              "0 0 40px",

            display:
              "grid",

            placeItems:
              "center",

            borderRadius:
              13,

            background:
              "var(--cg-surface-soft)",

            color:
              "var(--cg-text-secondary)",
          }}
        >
          {
            icon
          }
        </div>
      )}

      <div
        style={{
          minWidth:
            0,

          flex:
            1,
        }}
      >
        <p
          style={{
            margin:
              0,

            fontSize:
              14,

            fontWeight:
              750,
          }}
        >
          {title}
        </p>

        {description && (
          <p
            style={{
              margin:
                "4px 0 0",

              fontSize:
                12,

              lineHeight:
                1.5,

              color:
                "var(--cg-text-muted)",
            }}
          >
            {description}
          </p>
        )}
      </div>

      {
        action
      }
    </div>
  );
}


export function EmptyState({
  icon,
  title,
  description,
  action,
}) {
  return (
    <div
      style={{
        padding:
          "50px 24px",

        border:
          "1px dashed var(--cg-border-strong)",

        borderRadius:
          "var(--cg-radius-xl)",

        textAlign:
          "center",

        background:
          "var(--cg-surface)",
      }}
    >
      {icon && (
        <div
          style={{
            width:
              54,

            height:
              54,

            margin:
              "0 auto",

            display:
              "grid",

            placeItems:
              "center",

            borderRadius:
              18,

            background:
              "var(--cg-accent-soft)",

            color:
              "var(--cg-accent)",
          }}
        >
          {
            icon
          }
        </div>
      )}

      <h3
        style={{
          margin:
            "18px 0 0",

          fontSize:
            20,

          letterSpacing:
            "-0.025em",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          maxWidth:
            430,

          margin:
            "8px auto 0",

          lineHeight:
            1.6,

          fontSize:
            14,

          color:
            "var(--cg-text-secondary)",
        }}
      >
        {
          description
        }
      </p>

      {action && (
        <div
          style={{
            marginTop:
              20,
          }}
        >
          {
            action
          }
        </div>
      )}
    </div>
  );
}


export function CheckList({
  items,
}) {
  return (
    <Stack gap={10}>
      {items.map(
        (
          item
        ) => (
          <Row
            key={
              item
            }
            gap={9}
            wrap={false}
          >
            <span
              style={{
                width:
                  22,

                height:
                  22,

                flex:
                  "0 0 22px",

                display:
                  "grid",

                placeItems:
                  "center",

                borderRadius:
                  "50%",

                background:
                  "var(--cg-accent-soft)",

                color:
                  "var(--cg-accent)",
              }}
            >
              <Check
                size={
                  13
                }
              />
            </span>

            <span
              style={{
                fontSize:
                  13,

                color:
                  "var(--cg-text-secondary)",
              }}
            >
              {
                item
              }
            </span>
          </Row>
        )
      )}
    </Stack>
  );
}


export function ActionLink({
  children,
}) {
  return (
    <span
      style={{
        display:
          "inline-flex",

        alignItems:
          "center",

        gap:
          5,

        color:
          "var(--cg-accent)",

        fontSize:
          13,

        fontWeight:
          800,
      }}
    >
      {children}

      <ArrowRight
        size={
          14
        }
      />
    </span>
  );
}