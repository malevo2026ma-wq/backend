import express from "express"
import {
  getBusinessConfig,
  updateBusinessConfig,
  getTicketConfig,
  updateTicketConfig,
  getAllConfig,
  printTicketEscpos,
  detectPrinters,
  connectPrinter,
  getPrinterStatus,
  testPrint
} from "../controllers/ticket.controller.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

router.use(authenticateToken)

// Rutas de configuración del negocio
router.get("/business", getBusinessConfig)
router.put("/business", updateBusinessConfig)

// Rutas de configuración de tickets
router.get("/ticket", getTicketConfig)
router.put("/ticket", updateTicketConfig)

// Ruta para obtener toda la configuración
router.get("/all", getAllConfig)

router.post("/print-escpos", printTicketEscpos)
router.get("/printers/detect", detectPrinters)
router.post("/printers/connect", connectPrinter)
router.get("/printers/status", getPrinterStatus)
router.post("/printers/test", testPrint)

export default router
