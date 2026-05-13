import api from "@/lib/api";

export interface SubscriptionPlan {
    id: number;
    name: string;
    duration_months: number;
    price: number;
    price_per_month: number;
    currency: string;
    badge: string | null;
    savings_percent: number;
    is_recommended: boolean;
    is_active: boolean;
}

export interface CurrentSubscription {
    id: number;
    plan_id: number;
    plan_name: string;
    start_date: string;
    end_date: string;
    status: string;
    days_remaining: number;
}

export interface SubscriptionOverview {
    plans: SubscriptionPlan[];
    current_subscription: CurrentSubscription | null;
    features: string[];
    payment: {
        gateway_configured: boolean;
        message: string;
    };
}

export interface SubscriptionCheckout {
    order_id: number;
    status: string;
    checkout_url: string | null;
    amount: number;
    currency: string;
    plan: SubscriptionPlan;
    message: string;
}

export const subscriptionService = {
    async getOverview(): Promise<SubscriptionOverview> {
        const response = await api.get<SubscriptionOverview>("/subscriptions/me");
        return response.data;
    },

    async checkout(planId: number): Promise<SubscriptionCheckout> {
        const response = await api.post<SubscriptionCheckout>("/subscriptions/checkout", {
            plan_id: planId,
        });
        return response.data;
    },
};
