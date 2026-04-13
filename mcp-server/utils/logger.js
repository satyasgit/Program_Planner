/**
 * Logger Utility for MCP Server
 * Pure Node.js implementation without external dependencies
 * Supports multiple log levels, file/console output, and rotation
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const appendFile = promisify(fs.appendFile);
const stat = promisify(fs.stat);
const rename = promisify(fs.rename);
const mkdir = promisify(fs.mkdir);

class Logger {
  constructor(options = {}) {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.config = {
      level: options.level || 'info',
      console: options.console !== false,
      file: options.file !== false,
      logDir: options.logDir || path.join(process.cwd(), 'logs'),
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: options.maxFiles || 5,
      timestamp: options.timestamp !== false,
      format: options.format || 'json' // json or text
    };
    
    this.currentLevel = this.levels[this.config.level] || this.levels.info;
    this.initializeLogDirectory();
  }
  
  async initializeLogDirectory() {
    try {
      await mkdir(this.config.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }
  
  getTimestamp() {
    return new Date().toISOString();
  }
  
  formatMessage(level, message, meta = {}) {
    const timestamp = this.config.timestamp ? this.getTimestamp() : null;
    
    if (this.config.format === 'json') {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
        pid: process.pid
      }) + '\n';
    } else {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}\n`;
    }
  }
  
  async writeToFile(formattedMessage) {
    if (!this.config.file) return;
    
    const logFile = path.join(this.config.logDir, 'mcp-server.log');
    
    try {
      // Check if rotation is needed
      await this.rotateIfNeeded(logFile);
      
      // Append to log file
      await appendFile(logFile, formattedMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  async rotateIfNeeded(logFile) {
    try {
      const stats = await stat(logFile);
      
      if (stats.size >= this.config.maxFileSize) {
        // Rotate log files
        for (let i = this.config.maxFiles - 1; i > 0; i--) {
          const oldFile = `${logFile}.${i}`;
          const newFile = `${logFile}.${i + 1}`;
          
          try {
            await stat(oldFile);
            await rename(oldFile, newFile);
          } catch (error) {
            // File doesn't exist, skip
          }
        }
        
        // Rename current log file
        await rename(logFile, `${logFile}.1`);
      }
    } catch (error) {
      // Log file doesn't exist yet, that's fine
    }
  }
  
  writeToConsole(level, formattedMessage) {
    if (!this.config.console) return;
    
    const colorCodes = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[37m'  // White
    };
    
    const resetCode = '\x1b[0m';
    const coloredLevel = `${colorCodes[level]}[${level.toUpperCase()}]${resetCode}`;
    
    if (this.config.format === 'text') {
      console.log(formattedMessage.trim().replace(`[${level.toUpperCase()}]`, coloredLevel));
    } else {
      console.log(formattedMessage.trim());
    }
  }
  
  async log(level, message, meta = {}) {
    if (this.levels[level] > this.currentLevel) return;
    
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Write to console
    this.writeToConsole(level, formattedMessage);
    
    // Write to file
    await this.writeToFile(formattedMessage);
  }
  
  // Convenience methods
  async error(message, meta) {
    await this.log('error', message, meta);
  }
  
  async warn(message, meta) {
    await this.log('warn', message, meta);
  }
  
  async info(message, meta) {
    await this.log('info', message, meta);
  }
  
  async debug(message, meta) {
    await this.log('debug', message, meta);
  }
  
  // Express middleware for request/response logging
  middleware() {
    const logger = this;
    
    return async (req, res, next) => {
      const startTime = Date.now();
      const requestId = Math.random().toString(36).substring(7);
      
      // Log request
      await logger.info(`Incoming ${req.method} ${req.url}`, {
        requestId,
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: req.body,
        ip: req.ip || req.connection.remoteAddress
      });
      
      // Capture response
      const originalSend = res.send;
      res.send = function(data) {
        res.send = originalSend;
        
        // Log response
        const duration = Date.now() - startTime;
        logger.info(`Response ${req.method} ${req.url}`, {
          requestId,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          responseSize: data ? data.length : 0
        });
        
        return res.send(data);
      };
      
      next();
    };
  }
  
  // Error handling middleware
  errorMiddleware() {
    const logger = this;
    
    return async (err, req, res, next) => {
      await logger.error(`Unhandled error: ${err.message}`, {
        error: err.stack,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
      });
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
      });
    };
  }
}

// Create singleton instance
const logger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  console: process.env.LOG_CONSOLE !== 'false',
  file: process.env.LOG_FILE !== 'false',
  format: process.env.LOG_FORMAT || 'json'
});

module.exports = logger;
module.exports.Logger = Logger;