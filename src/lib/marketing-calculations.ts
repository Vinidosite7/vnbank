import { supabase } from "@/lib/supabase"

export async function getMonthlyAdsProfit() {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return { profit: 0, goal: 0 }
  }

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const { data, error } = await supabase
    .from("marketing_operations")
    .select("*")
    .eq("user_id", userData.user.id)

  if (error || !data) {
    console.error("ADS LOAD ERROR:", error)
    return { profit: 0, goal: 0 }
  }

  const monthlyOperations = data.filter(op => {
    const opDate = new Date(op.date)
    return (
      opDate.getMonth() === currentMonth &&
      opDate.getFullYear() === currentYear
    )
  })

  let totalProfit = 0

  monthlyOperations.forEach(op => {
    const tax = op.ad_spend * 0.13
    const profit =
      op.revenue -
      op.ad_spend -
      tax -
      (op.other_costs || 0)

    totalProfit += profit
  })

  // 👇 Meta padrão (pode virar campo depois)
  const goal = 10000

  return {
    profit: totalProfit,
    goal
  }
}
