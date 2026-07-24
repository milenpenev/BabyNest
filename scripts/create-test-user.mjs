import { createClient } from "@supabase/supabase-js";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  TEST_EMAIL,
  TEST_PASSWORD,
  TEST_NAME,
} = process.env;

if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY ||
  !TEST_EMAIL ||
  !TEST_PASSWORD ||
  !TEST_NAME
) {
  console.error(
    "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_EMAIL, TEST_PASSWORD or TEST_NAME.",
  );
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const { data, error } =
  await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: TEST_NAME,
    },
  });

if (error) {
  console.error("Failed to create test account:");
  console.error(error);
  process.exit(1);
}

console.log("Test account created successfully:");
console.log({
  id: data.user.id,
  email: data.user.email,
  displayName:
    data.user.user_metadata?.display_name,
});
