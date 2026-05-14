import { Router } from "express";
import { UserControllers } from "./user.controller";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";
import { multerUpload } from "../../config/multer.config";


const router = Router()

router.post("/register", validateRequest(createUserZodSchema), UserControllers.createUser)
router.get("/all-users", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserControllers.getAllUsers)
router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe)
router.patch("/me", checkAuth(...Object.values(Role)), multerUpload.single("picture"), validateRequest(updateUserZodSchema), UserControllers.updateUserController)
router.patch("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), multerUpload.single("picture"), validateRequest(updateUserZodSchema), UserControllers.updateUserByAdminController)
router.delete("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserControllers.deleteUserController)
router.get("/wishlist", checkAuth(...Object.values(Role)), UserControllers.getWishlist);
router.get("/:id", checkAuth(...Object.values(Role)), UserControllers.getSingleUser)
router.post("/wishlist/:tourId", checkAuth(...Object.values(Role)), UserControllers.toggleWishlist);

export const UserRoutes = router