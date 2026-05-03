from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field

from app.api import deps
from app.models.dictionary import DictionaryWord, WordExample, WordCollocation

router = APIRouter()

# Schemas
class WordExampleSchema(BaseModel):
    id: int
    zh_text: str
    pinyin: str
    target_text: str

    class Config:
        from_attributes = True

class WordCollocationSchema(BaseModel):
    id: int
    phrase_zh: str
    phrase_pinyin: str
    translation_target: str

    class Config:
        from_attributes = True

class VocabularyWordResponse(BaseModel):
    id: int
    chinese: str
    pinyin: str
    audio_url: Optional[str] = None
    level: str
    persian_meaning: Optional[str] = None
    chinese_meaning: Optional[str] = None
    composition: Optional[str] = None
    examples: List[WordExampleSchema] = Field(default_factory=list)
    collocations: List[WordCollocationSchema] = Field(default_factory=list)

    class Config:
        from_attributes = True


@router.get("/{word}", response_model=VocabularyWordResponse)
async def get_vocabulary_word(
    word: str,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Get vocabulary word details by Chinese character.
    Returns mock data for demo purposes.
    """
    # Mock vocabulary data for common words
    mock_data = {
        "打算": {
            "pinyin": "dǎ suàn",
            "persian_meaning": "قصد داشتن، خواستن",
            "chinese_meaning": "1. 关于行动的方向、方法等的想法；念头\n2. 考虑；计划",
            "composition": "打算盘\n另有打算",
            "examples": [
                {"id": 1, "zh_text": "他打算当医生", "pinyin": "Tā dǎsuàn dāng yīshēng", "target_text": "او قصد دارد پزشک شود"},
                {"id": 2, "zh_text": "各有各的打算", "pinyin": "Gè yǒu gè de dǎsuàn", "target_text": "هر کسی برنامه خودش را دارد"},
                {"id": 3, "zh_text": "为自己作打算", "pinyin": "Wèi zìjǐ zuò dǎsuàn", "target_text": "برای خودش برنامه‌ریزی کردن"},
            ]
        },
        "标题": {
            "pinyin": "biāo tí",
            "persian_meaning": "عنوان، تیتر",
            "chinese_meaning": "1. 标明文章、作品等内容的简短语句\n2. 题目",
            "composition": "大标题\n小标题",
            "examples": [
                {"id": 1, "zh_text": "文章的标题很好", "pinyin": "Wénzhāng de biāotí hěn hǎo", "target_text": "عنوان مقاله خیلی خوب است"},
                {"id": 2, "zh_text": "我们来读一下标题", "pinyin": "Wǒmen lái dú yīxià biāotí", "target_text": "بیایید عنوان را بخوانیم"},
            ]
        },
        "学习": {
            "pinyin": "xué xí",
            "persian_meaning": "یادگیری، درس خواندن",
            "chinese_meaning": "1. 从阅读、听讲、研究、实践中获得知识或技能\n2. 效法",
            "composition": "学习方法\n学习计划",
            "examples": [
                {"id": 1, "zh_text": "我在学习中文", "pinyin": "Wǒ zài xuéxí zhōngwén", "target_text": "من در حال یادگیری چینی هستم"},
                {"id": 2, "zh_text": "学习是很重要的", "pinyin": "Xuéxí shì hěn zhòngyào de", "target_text": "یادگیری خیلی مهم است"},
            ]
        },
        "热身": {
            "pinyin": "rè shēn",
            "persian_meaning": "گرم کردن بدن",
            "chinese_meaning": "1. 运动前使身体发热的准备活动\n2. 比喻正式活动前的准备",
            "composition": "热身运动\n热身活动",
            "examples": [
                {"id": 1, "zh_text": "运动前要热身", "pinyin": "Yùndòng qián yào rèshēn", "target_text": "قبل از ورزش باید گرم کنی"},
                {"id": 2, "zh_text": "这是热身环节", "pinyin": "Zhè shì rèshēn huánjié", "target_text": "این بخش گرم‌کردن است"},
            ]
        },
        "第三级": {
            "pinyin": "dì sān jí",
            "persian_meaning": "سطح سوم",
            "chinese_meaning": "第三个等级或阶段",
            "composition": "第一级\n第二级",
            "examples": [
                {"id": 1, "zh_text": "HSK第三级", "pinyin": "HSK dì sān jí", "target_text": "سطح سوم آزمون HSK"},
            ]
        },
    }
    
    # Get mock data or generate default
    word_data = mock_data.get(word, {
        "pinyin": "pīn yīn",
        "persian_meaning": "معنی فارسی",
        "chinese_meaning": "中文含义",
        "composition": "词语组合",
        "examples": [
            {"id": 1, "zh_text": f"这是{word}的例句", "pinyin": "Zhè shì lìjù", "target_text": "این یک مثال است"}
        ]
    })
    
    return VocabularyWordResponse(
        id=0,
        chinese=word,
        pinyin=word_data["pinyin"],
        audio_url=None,
        level="HSK3",
        persian_meaning=word_data["persian_meaning"],
        chinese_meaning=word_data["chinese_meaning"],
        composition=word_data["composition"],
        examples=[WordExampleSchema(**ex) for ex in word_data["examples"]],
        collocations=[]
    )


@router.get("/", response_model=List[VocabularyWordResponse])
async def search_vocabulary(
    q: str,
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 20,
) -> Any:
    """
    Search vocabulary words.
    """
    result = await db.execute(
        select(DictionaryWord)
        .options(
            selectinload(DictionaryWord.examples),
            selectinload(DictionaryWord.collocations)
        )
        .where(DictionaryWord.chinese.contains(q))
        .offset(skip)
        .limit(limit)
    )
    words = result.scalars().all()
    return words
