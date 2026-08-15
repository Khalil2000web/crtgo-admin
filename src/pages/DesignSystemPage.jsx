import {
  useState,
} from "react";

import {
  Bell,
  Building2,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  ActionLink,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CheckList,
  Container,
  CRTRGOTheme,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Row,
  Section,
  SettingRow,
  Stack,
  Tabs,
  Textarea,
} from "../crtrgo-ui";


export default function DesignSystemPage() {
  const [
    theme,
    setTheme,
  ] =
    useState(
      "light"
    );


  const [
    tab,
    setTab,
  ] =
    useState(
      "profile"
    );


  return (
    <CRTRGOTheme
      theme={
        theme
      }
    >
      <PageHeader
        eyebrow="CRTRGO UI v1"
        title="Design system blueprint"
        subtitle="The shared visual foundation for Accounts, Store, future services and new CRTRGO experiences."
        action={
          <Button
            variant="secondary"
            onClick={() =>
              setTheme(
                (
                  current
                ) =>
                  current ===
                  "light"
                    ? "dark"
                    : "light"
              )
            }
          >
            {theme ===
            "light"
              ? "Dark mode"
              : "Light mode"}
          </Button>
        }
      />


      <Container>
        <Section>
          <Stack gap={36}>

            {/* COLORS / BRAND */}

            <div>
              <SectionTitle
                title="Brand foundation"
                description="CRTRGO should feel clean, confident and calm — with orange used as identity, not wallpaper."
              />

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(150px, 1fr))",

                  gap:
                    12,

                  marginTop:
                    18,
                }}
              >
                <ColorCard
                  label="CRTRGO Orange"
                  value="#FF7A00"
                  color="var(--cg-accent)"
                />

                <ColorCard
                  label="Background"
                  value="Background"
                  color="var(--cg-bg)"
                />

                <ColorCard
                  label="Surface"
                  value="Surface"
                  color="var(--cg-surface)"
                />

                <ColorCard
                  label="Text"
                  value="Primary"
                  color="var(--cg-text)"
                />
              </div>
            </div>


            {/* BUTTONS */}

            <div>
              <SectionTitle
                title="Actions"
                description="One button language across every Carter Go product."
              />

              <Row
                gap={10}
                style={{
                  marginTop:
                    18,
                }}
              >
                <Button>
                  Continue
                </Button>

                <Button variant="secondary">
                  Cancel
                </Button>

                <Button variant="ghost">
                  Learn more
                </Button>

                <Button variant="danger">
                  Delete
                </Button>
              </Row>
            </div>


            {/* ACCOUNT EXAMPLE */}

            <div>
              <SectionTitle
                title="Account pattern"
                description="This is the direction for accounts.crtrgo.com."
              />

              <Card
                style={{
                  marginTop:
                    18,
                }}
              >
                <CardBody>
                  <Row
                    gap={16}
                    wrap={false}
                  >
                    <Avatar
                      name="Khalil"
                      size={62}
                    />

                    <div
                      style={{
                        minWidth:
                          0,

                        flex:
                          1,
                      }}
                    >
                      <Row gap={8}>
                        <h3
                          style={{
                            margin:
                              0,

                            fontSize:
                              22,

                            letterSpacing:
                              "-0.035em",
                          }}
                        >
                          Khalil
                        </h3>

                        <Badge tone="accent">
                          CRTRGO Account
                        </Badge>
                      </Row>

                      <p
                        style={{
                          margin:
                            "5px 0 0",

                          fontSize:
                            13,

                          color:
                            "var(--cg-text-secondary)",
                        }}
                      >
                        khalil@example.com
                      </p>
                    </div>

                    <Button variant="secondary">
                      Edit profile
                    </Button>
                  </Row>
                </CardBody>
              </Card>
            </div>


            {/* TABS */}

            <div>
              <SectionTitle
                title="Navigation"
                description="Compact tab navigation for settings and product sections."
              />

              <div
                style={{
                  maxWidth:
                    500,

                  marginTop:
                    18,
                }}
              >
                <Tabs
                  value={
                    tab
                  }
                  onChange={
                    setTab
                  }
                  items={[
                    {
                      value:
                        "profile",

                      label:
                        "Profile",
                    },

                    {
                      value:
                        "security",

                      label:
                        "Security",
                    },

                    {
                      value:
                        "preferences",

                      label:
                        "Preferences",
                    },
                  ]}
                />
              </div>
            </div>


            {/* FORM */}

            <div>
              <SectionTitle
                title="Forms"
                description="Shared fields remove visual differences between CRTRGO products."
              />

              <Card
                style={{
                  maxWidth:
                    700,

                  marginTop:
                    18,
                }}
              >
                <CardBody>
                  <Stack gap={18}>
                    <div
                      style={{
                        display:
                          "grid",

                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",

                        gap:
                          16,
                      }}
                    >
                      <Field
                        label="Display name"
                        hint="Shown across Carter Go."
                      >
                        <Input
                          defaultValue="Khalil"
                        />
                      </Field>

                      <Field
                        label="Username"
                        hint="Your unique Carter Go identity."
                      >
                        <Input
                          defaultValue="khalil"
                        />
                      </Field>
                    </div>

                    <Field
                      label="About"
                    >
                      <Textarea
                        placeholder="Optional description..."
                      />
                    </Field>

                    <Row>
                      <Button>
                        Save changes
                      </Button>

                      <Button variant="secondary">
                        Discard
                      </Button>
                    </Row>
                  </Stack>
                </CardBody>
              </Card>
            </div>


            {/* SETTINGS */}

            <div>
              <SectionTitle
                title="Settings pattern"
                description="Used by Account, Store settings, workspace settings and future products."
              />

              <Card
                style={{
                  maxWidth:
                    760,

                  marginTop:
                    18,
                }}
              >
                <CardBody>
                  <SettingRow
                    icon={
                      <UserRound
                        size={
                          18
                        }
                      />
                    }
                    title="Personal information"
                    description="Name, username and profile picture."
                    action={
                      <ActionLink>
                        Manage
                      </ActionLink>
                    }
                  />

                  <SettingRow
                    icon={
                      <Mail
                        size={
                          18
                        }
                      />
                    }
                    title="Email address"
                    description="Your login and recovery email."
                    action={
                      <ActionLink>
                        Manage
                      </ActionLink>
                    }
                  />

                  <SettingRow
                    icon={
                      <KeyRound
                        size={
                          18
                        }
                      />
                    }
                    title="Password"
                    description="Change your Carter Go password."
                    action={
                      <ActionLink>
                        Change
                      </ActionLink>
                    }
                  />

                  <SettingRow
                    icon={
                      <ShieldCheck
                        size={
                          18
                        }
                      />
                    }
                    title="Security"
                    description="Sessions and sign-in security."
                    action={
                      <ActionLink>
                        Review
                      </ActionLink>
                    }
                  />

                  <SettingRow
                    icon={
                      <Bell
                        size={
                          18
                        }
                      />
                    }
                    title="Notifications"
                    description="Choose what Carter Go sends you."
                    action={
                      <ActionLink>
                        Configure
                      </ActionLink>
                    }
                  />
                </CardBody>
              </Card>
            </div>


            {/* PRODUCT CARD */}

            <div>
              <SectionTitle
                title="CRTRGO product card"
                description="Reusable across the Carter Go ecosystem."
              />

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",

                  gap:
                    16,

                  marginTop:
                    18,
                }}
              >
                <ProductCard
                  icon={
                    <Building2
                      size={
                        24
                      }
                    />
                  }
                  title="Menu"
                  description="Digital menus, restaurant websites and publishing."
                  status="Available"
                  active
                />

                <ProductCard
                  icon={
                    <Building2
                      size={
                        24
                      }
                    />
                  }
                  title="Store"
                  description="Products, checkout and online orders."
                  status="Coming soon"
                />
              </div>
            </div>


            {/* EMPTY */}

            <div>
              <SectionTitle
                title="Empty states"
                description="Useful, calm and action-oriented."
              />

              <div
                style={{
                  marginTop:
                    18,
                }}
              >
                <EmptyState
                  icon={
                    <Building2
                      size={
                        24
                      }
                    />
                  }
                  title="No businesses yet"
                  description="Create your first Carter Go business workspace to start using services."
                  action={
                    <Button>
                      Create business
                    </Button>
                  }
                />
              </div>
            </div>


            {/* PRINCIPLES */}

            <div>
              <SectionTitle
                title="Design rules"
                description="The rules future CRTRGO pages should follow."
              />

              <Card
                style={{
                  marginTop:
                    18,
                }}
              >
                <CardBody>
                  <CheckList
                    items={[
                      "Orange is the brand accent, not the entire interface.",
                      "Every new CRTRGO product supports light and dark foundations.",
                      "RTL must work from the beginning.",
                      "Use generous spacing and readable typography.",
                      "Avoid giant gradients, glass everywhere and generic dashboard-kit styling.",
                      "One component should behave consistently across every Carter Go product.",
                      "Product-specific personality belongs above the shared foundation, not instead of it.",
                    ]}
                  />
                </CardBody>
              </Card>
            </div>
          </Stack>
        </Section>
      </Container>
    </CRTRGOTheme>
  );
}


function SectionTitle({
  title,
  description,
}) {
  return (
    <div>
      <h2
        style={{
          margin:
            0,

          fontSize:
            24,

          letterSpacing:
            "-0.035em",
        }}
      >
        {
          title
        }
      </h2>

      <p
        style={{
          maxWidth:
            650,

          margin:
            "6px 0 0",

          fontSize:
            14,

          lineHeight:
            1.6,

          color:
            "var(--cg-text-secondary)",
        }}
      >
        {
          description
        }
      </p>
    </div>
  );
}


function ColorCard({
  label,
  value,
  color,
}) {
  return (
    <Card>
      <div
        style={{
          height:
            90,

          margin:
            10,

          border:
            "1px solid var(--cg-border)",

          borderRadius:
            15,

          background:
            color,
        }}
      />

      <div
        style={{
          padding:
            "6px 14px 15px",
        }}
      >
        <strong
          style={{
            display:
              "block",

            fontSize:
              13,
          }}
        >
          {
            label
          }
        </strong>

        <span
          style={{
            display:
              "block",

            marginTop:
              3,

            fontSize:
              11,

            color:
              "var(--cg-text-muted)",
          }}
        >
          {
            value
          }
        </span>
      </div>
    </Card>
  );
}


function ProductCard({
  icon,
  title,
  description,
  status,
  active = false,
}) {
  return (
    <Card>
      <CardBody>
        <Row>
          <div
            style={{
              width:
                48,

              height:
                48,

              display:
                "grid",

              placeItems:
                "center",

              borderRadius:
                16,

              background:
                active
                  ? "var(--cg-accent-soft)"
                  : "var(--cg-surface-soft)",

              color:
                active
                  ? "var(--cg-accent)"
                  : "var(--cg-text-muted)",
            }}
          >
            {
              icon
            }
          </div>

          <Badge
            tone={
              active
                ? "success"
                : "neutral"
            }
          >
            {
              status
            }
          </Badge>
        </Row>

        <h3
          style={{
            margin:
              "18px 0 0",

            fontSize:
              20,

            letterSpacing:
              "-0.03em",
          }}
        >
          {
            title
          }
        </h3>

        <p
          style={{
            minHeight:
              44,

            margin:
              "7px 0 0",

            lineHeight:
              1.55,

            fontSize:
              13,

            color:
              "var(--cg-text-secondary)",
          }}
        >
          {
            description
          }
        </p>

        <div
          style={{
            marginTop:
              18,
          }}
        >
          <ActionLink>
            Explore
          </ActionLink>
        </div>
      </CardBody>
    </Card>
  );
}