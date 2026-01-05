import { Router } from "express";
import { UserControllers } from "./user.controller";
import { createUserZodSchema, updateUserZodSchema, wishlistZodSchema } from "./user.validation";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";
import { multerUpload } from "../../config/multer.config";


const router = Router()

router.post("/register", validateRequest(createUserZodSchema), UserControllers.createUser)
router.get("/all-users", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserControllers.getAllUsers)
router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe)
router.patch("/me", checkAuth(...Object.values(Role)), multerUpload.single("picture"), validateRequest(updateUserZodSchema), UserControllers.updateUserController)
router.get("/:id", checkAuth(...Object.values(Role)), UserControllers.getSingleUser)
router.post("/wishlist/:tourId", checkAuth(...Object.values(Role)), UserControllers.toggleWishlist);
router.get("/wishlist", checkAuth(...Object.values(Role)), validateRequest(wishlistZodSchema), UserControllers.getWishlist);

export const UserRoutes = router