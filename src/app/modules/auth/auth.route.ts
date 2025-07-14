import { Router } from "express";
import { AuthControllers } from "./auth.controller";
import { UserControllers } from "../user/user.controller";
// import { validateRequest } from "../../middlewares/validateRequest";
// import { updateUserZodSchema } from "../user/user.validation";
import { Role } from "../user/user.interface";
import { checkAuth } from "../../middlewares/checkAuth";

const router = Router()

router.post("/login", AuthControllers.credentialsLogin)
router.get("/all-users", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserControllers.getAllUsers)
// router.patch("/:id", validateRequest(updateUserZodSchema), checkAuth(...Object.values(Role)), UserControllers.updateUser)

export const AuthRoutes = router;