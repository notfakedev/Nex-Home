import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkoutRouter from "./checkout";
import ordersRouter from "./orders";
import productsRouter from "./products";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(checkoutRouter);
router.use(ordersRouter);
router.use(productsRouter);
router.use(settingsRouter);

export default router;
