// src/models/Vocabulary/__mocks__/AcceptedWordBuryat.ts
const mockLean = jest.fn().mockResolvedValue(null); // По умолчанию возвращает null
const mockPopulate = jest.fn().mockReturnThis(); // Возвращает себя для цепочки
const mockSkip = jest.fn().mockReturnThis(); // Возвращает себя для цепочки
const mockFindById = jest.fn(() => ({
    populate: mockPopulate,
    lean: mockLean,
}));
const mockFindOne = jest.fn(() => ({
    skip: mockSkip,
    populate: mockPopulate,
    lean: mockLean,
}));
const mockCountDocuments = jest.fn().mockResolvedValue(0); // По умолчанию 0

const AcceptedWordBuryat = {
    findById: mockFindById,
    findOne: mockFindOne,
    countDocuments: mockCountDocuments,
    // Сброс моков (для использования в beforeEach/afterEach)
    __resetMocks: () => {
        mockLean.mockClear().mockResolvedValue(null); // Сброс к дефолту
        mockPopulate.mockClear().mockReturnThis();
        mockSkip.mockClear().mockReturnThis();
        mockFindById.mockClear().mockImplementation(() => ({
            // Пересоздаем, чтобы populate/lean были "свежими"
            populate: mockPopulate,
            lean: mockLean,
        }));
        mockFindOne.mockClear().mockImplementation(() => ({
            // Пересоздаем, чтобы skip/populate/lean были "свежими"
            skip: mockSkip,
            populate: mockPopulate,
            lean: mockLean,
        }));
        mockCountDocuments.mockClear().mockResolvedValue(0); // Сброс к дефолту
    },
    // Геттеры для доступа к мокам внутри тестов
    __mockLean: mockLean,
    __mockPopulate: mockPopulate,
    __mockSkip: mockSkip,
    __mockFindById: mockFindById,
    __mockFindOne: mockFindOne,
    __mockCountDocuments: mockCountDocuments,
};

export default AcceptedWordBuryat;
