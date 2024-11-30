import express from "express";
import { body, query } from "express-validator";
import themeController from "../controllers/themeController";
import authenticateToken from "../middleware/authenticateToken";
import authorizeAdmin from "../middleware/authorizeAdmin";
import validate from "../middleware/validate";

const themeRouter = express.Router();

/**
 * @route   GET /backendapi/themes
 * @desc    Получение всех тем
 * @access  Public
 */
themeRouter.get("/", themeController.getAllThemes);

/**
 * @route   GET /backendapi/themes/paginated
 * @desc    Получение тем с пагинацией
 * @access  Public
 */
themeRouter.get(
    "/paginated",
    [
        query("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage("page должен быть целым числом больше 0"),
        query("limit")
            .optional()
            .isInt({ min: 1 })
            .withMessage("limit должен быть целым числом больше 0"),
    ],
    validate,
    themeController.getThemesPaginated
);

/**
 * @route   GET /backendapi/themes/:id
 * @desc    Получение одной темы по ID
 * @access  Public
 */
themeRouter.get(
    "/:id",
    [
        query("id")
            .isMongoId()
            .withMessage("ID должен быть валидным ObjectId"),
    ],
    validate,
    themeController.getThemeById
);

/**
 * @route   POST /backendapi/themes
 * @desc    Создание новой темы
 * @access  Private/Admin
 */
themeRouter.post(
    "/",
    authenticateToken,
    authorizeAdmin,
    [
        body("name")
            .isString()
            .withMessage("name должен быть строкой")
            .notEmpty()
            .withMessage("name не может быть пустым"),
        body("description")
            .optional()
            .isString()
            .withMessage("description должен быть строкой"),
        body("words")
            .optional()
            .isArray()
            .withMessage("words должен быть массивом ObjectId"),
        body("words.*")
            .optional()
            .isMongoId()
            .withMessage("Каждый элемент в words должен быть валидным ObjectId"),
    ],
    validate,
    themeController.createTheme
);

/**
 * @route   PUT /backendapi/themes/:id
 * @desc    Обновление темы
 * @access  Private/Admin
 */
themeRouter.put(
    "/:id",
    authenticateToken,
    authorizeAdmin,
    [
        body("name")
            .optional()
            .isString()
            .withMessage("name должен быть строкой"),
        body("description")
            .optional()
            .isString()
            .withMessage("description должен быть строкой"),
        body("words")
            .optional()
            .isArray()
            .withMessage("words должен быть массивом ObjectId"),
        body("words.*")
            .optional()
            .isMongoId()
            .withMessage("Каждый элемент в words должен быть валидным ObjectId"),
    ],
    validate,
    themeController.updateTheme
);

/**
 * @route   DELETE /backendapi/themes/:id
 * @desc    Удаление темы
 * @access  Private/Admin
 */
themeRouter.delete(
    "/:id",
    authenticateToken,
    authorizeAdmin,
    [
        query("id")
            .isMongoId()
            .withMessage("ID должен быть валидным ObjectId"),
    ],
    validate,
    themeController.deleteTheme
);

export default themeRouter;
