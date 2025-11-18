import { SerialPort } from 'serialport'
import { executeQuery } from '../config/database.js'

class PrinterService {
  constructor() {
    this.port = null
    this.isConnected = false
    this.portName = null
    this.printerConfig = null
  }

  async initialize() {
    try {
      const config = await executeQuery('SELECT * FROM ticket_config LIMIT 1')
      if (config.length > 0) {
        this.printerConfig = config[0]
        console.log('[PRINTER] Configuración cargada:', {
          printerName: this.printerConfig.printer_name,
          baudRate: this.printerConfig.baud_rate || 9600
        })
      }
    } catch (error) {
      console.error('[PRINTER] Error al cargar configuración:', error.message)
    }
  }

  async detectPrinters() {
    try {
      const ports = await SerialPort.list()
      console.log('[PRINTER] Puertos detectados:', ports)
      return ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer || 'Unknown',
        serialNumber: port.serialNumber || 'Unknown',
        productId: port.productId,
        vendorId: port.vendorId
      }))
    } catch (error) {
      console.error('[PRINTER] Error detectando puertos:', error.message)
      return []
    }
  }

  async connectToPrinter(portPath, baudRate = 9600) {
    return new Promise((resolve, reject) => {
      try {
        if (this.port && this.isConnected) {
          this.port.close()
        }

        this.port = new SerialPort({
          path: portPath,
          baudRate: baudRate || 9600,
          autoOpen: false
        })

        this.port.open((error) => {
          if (error) {
            console.error('[PRINTER] Error abriendo puerto:', error.message)
            this.isConnected = false
            this.port = null
            reject(error)
          } else {
            console.log('[PRINTER] Conectado a:', portPath)
            this.isConnected = true
            this.portName = portPath
            resolve(true)
          }
        })

        // Manejar errores después de abrir
        this.port.on('error', (error) => {
          console.error('[PRINTER] Error del puerto:', error.message)
          this.isConnected = false
        })

        this.port.on('close', () => {
          console.log('[PRINTER] Puerto cerrado')
          this.isConnected = false
        })
      } catch (error) {
        console.error('[PRINTER] Error al conectar:', error.message)
        reject(error)
      }
    })
  }

  async sendToPrinter(data) {
    return new Promise((resolve, reject) => {
      if (!this.port || !this.isConnected) {
        console.error('[PRINTER] Puerto no conectado')
        reject(new Error('Impresora no conectada'))
        return
      }

      try {
        // Si es Base64, decodificar
        let buffer
        if (typeof data === 'string') {
          // Asumir que es Base64
          buffer = Buffer.from(data, 'base64')
        } else {
          buffer = data
        }

        console.log('[PRINTER] Enviando', buffer.length, 'bytes a la impresora')

        this.port.write(buffer, (error) => {
          if (error) {
            console.error('[PRINTER] Error escribiendo en puerto:', error.message)
            reject(error)
          } else {
            console.log('[PRINTER] Datos enviados exitosamente')
            // Esperar a que se vuelva a estar listo (mínimo 100ms)
            setTimeout(() => {
              resolve(true)
            }, 100)
          }
        })

        // Timeout de 10 segundos
        const timeout = setTimeout(() => {
          reject(new Error('Timeout enviando datos a la impresora'))
        }, 10000)

        this.port.once('drain', () => {
          clearTimeout(timeout)
          resolve(true)
        })
      } catch (error) {
        console.error('[PRINTER] Error preparando datos:', error.message)
        reject(error)
      }
    })
  }

  async disconnectPrinter() {
    return new Promise((resolve) => {
      if (this.port && this.isConnected) {
        this.port.close(() => {
          this.isConnected = false
          this.port = null
          console.log('[PRINTER] Desconectado')
          resolve(true)
        })
      } else {
        resolve(true)
      }
    })
  }

  isConnectedToPrinter() {
    return this.isConnected && this.port !== null
  }

  getStatus() {
    return {
      connected: this.isConnected,
      portName: this.portName,
      config: this.printerConfig
    }
  }
}

export default new PrinterService()
