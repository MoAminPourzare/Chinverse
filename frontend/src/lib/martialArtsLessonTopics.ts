/** Lesson topics in the order shown by the martial arts page references. */
export const MARTIAL_ARTS_LESSON_TOPICS: Record<string, string[]> = {
    "xue-guoxue-wang-eight-form-taijiquan": [
        "发刊词：零基础学会太极拳，越练越健康",
        "入门基本功：掌型、步法、桩法、平衡和呼吸",
        "卷肱式：灵活关节，畅通气血",
        "搂膝拗步：身轻心安，放松神经",
        "野马分鬃：强身健体，活络筋骨",
        "云手：柔韧身体，塑形瘦身",
        "太极拳第一阶段完整动作训练（前四式）",
        "金鸡独立：稳定下肢，锻炼平衡",
        "蹬脚：刚柔相济，增强力量",
        "揽雀尾：强腰固肾，气血充盈",
        "十字手：凝神养气，调整身心",
        "太极拳第二阶段完整动作训练（后四式）",
        "八式太极拳完整动作训练",
    ],
    "lee-wushu-basic-staff": Array.from({ length: 10 }, (_, index) =>
        index === 0 ? "基础棍术" : "基础棍术 教学",
    ),
    "taichi-wei-kung-fu-fan": Array.from({ length: 13 }, () => "太极功夫扇"),
};
