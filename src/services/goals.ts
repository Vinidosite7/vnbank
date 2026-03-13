import { supabase } from "../lib/supabase";

export async function fetchGoals() {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createGoal(goal: {
  title: string;
  target_amount: number;
  deadline?: string;
}) {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("goals")
    .insert([
      {
        user_id: userData.user?.id,
        ...goal,
      },
    ])
    .select();

  if (error) throw error;
  return data[0];
}

export async function updateGoal(id: string, current_amount: number) {
  const { data, error } = await supabase
    .from("goals")
    .update({ current_amount })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0];
}
