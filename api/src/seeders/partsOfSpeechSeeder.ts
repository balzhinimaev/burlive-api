import mongoose from 'mongoose';
import PartOfSpeechClassifierModel, {
    ClassifierLanguage,
} from '../models/Classifiers/PartOfSpeechClassifierModel'; // Убедитесь, что путь верный
import dotenv from 'dotenv';
dotenv.config();
// -- КОНФИГУРАЦИЯ --
// Замените на ваш URI для подключения к MongoDB
const MONGO_URI =
    process.env.MONGO_URL || 'mongodb://localhost:27017/your_database_name';
type PartOfSpeechSeedData = {
    name_buryat: string;
    name_russian: string;
    code: string;
    language_specific: ClassifierLanguage;
    description_buryat?: string; // Use '?' if optional in the schema/interface
    description_russian?: string; // Use '?' if optional in the schema/interface
};
// Данные для сидинга
// Вы можете расширить этот список или изменить описания
const partsOfSpeechData: PartOfSpeechSeedData[] = [
    // --- Бурятские/Общие части речи ---
    {
        name_buryat: 'Нэрэ үгэ',
        name_russian: 'Имя существительное',
        code: 'NOUN',
        language_specific: ClassifierLanguage.BURYAT,
        description_buryat:
            'Юумэ, үзэгдэл, хүн, амитан зэргые нэрлэһэн үгэ. Хэн? Юун? гэһэн асуудалда харюусана.',
        description_russian:
            'Часть речи, обозначающая предмет, лицо, явление, понятие и отвечающая на вопросы «кто?» или «что?».',
    },
    {
        name_buryat: 'Тэмдэгэй нэрэ',
        name_russian: 'Имя прилагательное',
        code: 'ADJECTIVE',
        language_specific: ClassifierLanguage.BURYAT,
        description_buryat:
            'Юумэнэй шэнжые тэмдэглэһэн үгэ. Ямар? Хэнэй? гэһэн асуудалда харюусана.',
        description_russian:
            'Часть речи, обозначающая признак предмета и отвечающая на вопросы «какой?», «чей?».',
    },
    {
        name_buryat: 'Тоогой нэрэ',
        name_russian: 'Имя числительное',
        code: 'NUMERAL',
        language_specific: ClassifierLanguage.BURYAT,
        description_buryat:
            'Юумэнэй тоо, тоолоходохи дэс дараа тэмдэглэһэн үгэ. Хэды? Хэдыдэхи? гэһэн асуудалда харюусана.',
        description_russian:
            'Часть речи, обозначающая количество предметов или их порядок при счёте.',
    },
    {
        name_buryat: 'Түлөөнэй нэрэ',
        name_russian: 'Местоимение',
        code: 'PRONOUN',
        language_specific: ClassifierLanguage.BURYAT,
        description_buryat:
            'Нэрэ үгэ, тэмдэгэй нэрэ, тоогой нэрын орондо хэрэглэгдэдэг үгэ.',
        description_russian:
            'Часть речи, указывающая на предметы, признаки или количества, но не называющая их.',
    },
    {
        name_buryat: 'Үйлэ үгэ',
        name_russian: 'Глагол',
        code: 'VERB',
        language_specific: ClassifierLanguage.BURYAT,
        description_buryat:
            'Юумэнэй үйлэ, хүдэлөөн, байдал тэмдэглэһэн үгэ. Юу хэнэб? Яанаб? гэһэн асуудалда харюусана.',
        description_russian:
            'Часть речи, обозначающая действие или состояние предмета.',
    },
    {
        name_buryat: 'Дайбар үгэ',
        name_russian: 'Наречие',
        code: 'ADVERB',
        language_specific: ClassifierLanguage.BURYAT,
        description_buryat:
            'Үйлын, шэнжын али нүгөө дайбарай тэмдэг зааһан хубилашагүй үгэ. Хаана? Хэзээ? Яажа? гэһэн асуудалда харюусана.',
        description_russian:
            'Часть речи, обозначающая признак действия, признак другого признака или обстоятельства.',
    },
    {
        name_buryat: 'Дахуул үгэ',
        name_russian: 'Послелог',
        code: 'POSTPOSITION',
        language_specific: ClassifierLanguage.BURYAT,
        description_buryat:
            'Нэрэ үгэнүүдэй хойноһоо орожо, тэдэнэй бусад үгэнүүдтэй холбоо харуулдаг туһалагша үгэ.',
        description_russian:
            'Служебная часть речи, выражающая различные отношения между словами и стоящая после управляемого слова (характерно для тюркских и монгольских языков).',
    },
    {
        name_buryat: 'Холбооһо үгэ',
        name_russian: 'Союз',
        code: 'CONJUNCTION',
        language_specific: ClassifierLanguage.BURYAT, // Может быть и COMMON
        description_buryat:
            'Мэдүүлэлэй адли гишүүдые ба ниилэмэл мэдүүлэлэй хубинуудые холбодог туһалагша үгэ.',
        description_russian:
            'Служебная часть речи, связывающая однородные члены предложения, части сложного предложения или отдельные предложения.',
    },
    {
        name_buryat: 'Бөөм', // Более точное название для частицы в бурятском
        name_russian: 'Частица',
        code: 'PARTICLE',
        language_specific: ClassifierLanguage.BURYAT, // Может быть и COMMON
        description_buryat:
            'Үгын ба мэдүүлэлэй удхада нэмэлтэ янза оруулдаг туһалагша үгэ.',
        description_russian:
            'Служебная часть речи, вносящая различные оттенки значения в предложение или служащая для образования форм слова.',
    },
    {
        name_buryat: 'Дууялга үгэ',
        name_russian: 'Междометие',
        code: 'INTERJECTION',
        language_specific: ClassifierLanguage.BURYAT, // Может быть и COMMON
        description_buryat: 'Хүнэй сэдьхэлэй хүдэлөөн, дуудалга мэдүүлдэг үгэ.',
        description_russian:
            'Часть речи, выражающая чувства, побуждения, но не называющая их.',
    },
    {
        name_buryat: 'Причасти', // Можно оставить русское или найти бурятский термин, если он явно отличается от глагольной формы
        name_russian: 'Причастие',
        code: 'PARTICIPLE',
        language_specific: ClassifierLanguage.BURYAT,
        description_buryat:
            'Үйлэ үгын ба тэмдэгэй нэрын шэнжэ шанар хабсаржа байгуулһан хэлбэри.',
        description_russian:
            'Особая форма глагола (или самостоятельная часть речи), обозначающая признак предмета по действию.',
    },
    {
        name_buryat: 'Деепричасти', // Аналогично причастию
        name_russian: 'Деепричастие',
        code: 'GERUND', // или ADVERBIAL_PARTICIPLE
        language_specific: ClassifierLanguage.BURYAT,
        description_buryat:
            'Нэмэлтэ үйлэ тэмдэглэһэн үйлэ үгын хубилашагүй хэлбэри.',
        description_russian:
            'Особая форма глагола (или самостоятельная часть речи), обозначающая добавочное действие.',
    },
    // Можно добавить специфичные для русского языка, если они как-то отличаются по смыслу
    // Например, если "Категория состояния" выделяется отдельно и имеет свой код.
    // {
    //     name_buryat: 'Байдалай үгэ', // Примерный перевод
    //     name_russian: 'Категория состояния',
    //     code: 'STATE_WORD',
    //     language_specific: ClassifierLanguage.RUSSIAN, // Специфично для русской грамматики
    //     description_russian: 'Слова, обозначающие состояние природы, окружающей среды, физическое или психическое состояние живых существ.',
    // },
];

async function seedPartsOfSpeech() {
    console.log('Начало сидинга классификаторов частей речи...');
    try {
        await mongoose.connect(MONGO_URI, { dbName: "burlive" });
        console.log('Успешно подключено к MongoDB:', MONGO_URI);

        // Опционально: удалить существующие для "чистого" сидинга
        // const deleted = await PartOfSpeechClassifierModel.deleteMany({});
        // console.log(`Удалено ${deleted.deletedCount} старых классификаторов.`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const posData of partsOfSpeechData) {
            // Проверяем, существует ли уже запись с таким кодом
            const existingClassifier =
                await PartOfSpeechClassifierModel.findOne({
                    code: posData.code,
                });

            if (existingClassifier) {
                console.log(
                    `Классификатор с кодом "${posData.code}" (${posData.name_russian}) уже существует. Пропускаем.`,
                );
                skippedCount++;
            } else {
                await PartOfSpeechClassifierModel.create(posData);
                console.log(
                    `Создан классификатор: "${posData.code}" (${posData.name_russian})`,
                );
                createdCount++;
            }
        }

        console.log('---------------------------------------------------');
        console.log('Сидинг классификаторов частей речи завершен.');
        console.log(`Создано новых классификаторов: ${createdCount}`);
        console.log(`Пропущено (уже существуют): ${skippedCount}`);
        console.log('---------------------------------------------------');
    } catch (error) {
        console.error('Ошибка во время сидинга:', error);
        process.exit(1); // Выход с ошибкой, если сидинг критичен
    } finally {
        await mongoose.disconnect();
        console.log('Отключено от MongoDB.');
    }
}

// --- ЗАПУСК СИДЕРА ---
// Этот блок позволяет запускать файл напрямую через `ts-node src/seeders/partsOfSpeechSeeder.ts`
// или `node dist/seeders/partsOfSpeechSeeder.js` после компиляции
if (require.main === module) {
    seedPartsOfSpeech().catch((err) => {
        console.error('Непредвиденная ошибка при запуске сидера:', err);
        process.exit(1);
    });
}

export default seedPartsOfSpeech; // Экспортируем, если нужно вызывать из другого места
