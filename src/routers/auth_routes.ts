import { Router } from "express";
import authenticate from "../middleware/authenticate.ts";
import UserController from "../controllers/userController.ts";

export const routerAuth = Router();

routerAuth.post("/signup", UserController.addNewUser.bind(UserController));

routerAuth.post("/login", UserController.userLogin.bind(UserController));

routerAuth.post("/google", UserController.userGoogle.bind(UserController));

routerAuth.get(
  "/current",
  authenticate,
  UserController.getCurrentUser.bind(UserController),
);

routerAuth.post(
  "/logout",
  authenticate,
  UserController.logOutUser.bind(UserController),
);

routerAuth.delete(
  "/delete",
  authenticate,
  UserController.delete.bind(UserController),
);
