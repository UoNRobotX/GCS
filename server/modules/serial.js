'use strict';

let fs = require('fs');
let path = require('path');
let crc32 = require('buffer-crc32');
let EventEmitter = require('events');
let serialport = require('serialport');

class Serial extends EventEmitter {
    constructor(inputFile, outputFile, baudRate) {
        super();

        this.inputFile = null;
        this.outputFile = null;
        this.serialStream = null;
        this.inputMessageBuffer = new Buffer(0);

        this.HEADER_SIZE = 8;
        this.CHECKSUM_SIZE = 4;
        this.TYPE_OFFSET = 3;
        this.SIZE_OFFSET = 4;
        this.MAGIC_NUMBER = new Buffer([0x17, 0xC0, 0x42]);

        this.initInput(inputFile, baudRate);
        this.initOutput(outputFile);
    }

    initInput(inputFile, baudRate) {
        let inputFileStats = fs.statSync(inputFile);

        if (inputFileStats.isCharacterDevice()) {
            this.serialStream = new serialport(inputFile, {
                baudRate: Number(baudRate)
            });

            this.serialStream.on('data', (data) => {
                this.processInputData(data);
            });

            this.serialStream.on('error', (e) => {
                this.emit('error', 'Error reading/writing from/to port', e);
            });

            return;
        }

        fs.open(inputFile, 'r', (error, fd) => {
            if (error) {
                console.log(error);
                throw new Error('Error with opening input file');
            }

            let bytesRead = 0;
            const BUFFER_SIZE = 64;
            let buffer = new Buffer(BUFFER_SIZE);

            let readBytes = () => {
                if (fs.statSync(inputFile).size > bytesRead) {
                    fs.read(fd, buffer, 0, BUFFER_SIZE, bytesRead, (error, numOfBytesRead, buffer) => {
                        if (error) {
                            this.emit('error', 'Error with reading input file', error);
                        }

                        this.processInputData(buffer.slice(0, numOfBytesRead));

                        bytesRead += numOfBytesRead;
                        readBytes();
                    });
                } else {
                    setTimeout(readBytes, 100);
                }
            };

            readBytes();
        });
    }

    initOutput(outputFile) {
        let outputFileStats = fs.statSync(outputFile);

        if (outputFileStats.isCharacterDevice()) {
            return; // The serial stream is already initialized (from this.initInput)
        }

        this.outputFile = fs.createWriteStream(outputFile, {
            flags: 'a'
        });

        this.outputFile.on('error', (error) => {
            this.emit('error', 'Error with writing output file', error);
        });
    }

    processInputData(buffer) {
        this.inputMessageBuffer = Buffer.concat([this.inputMessageBuffer, buffer]);

        // Find magic number prefix
        let i = 0;

        while (i + 2 < this.inputMessageBuffer.length) {
            if (this.inputMessageBuffer[i] != this.MAGIC_NUMBER[0] ||
                this.inputMessageBuffer[i + 1] != this.MAGIC_NUMBER[1] ||
                this.inputMessageBuffer[i + 2] != this.MAGIC_NUMBER[2]) {
                i++;
            } else {
                break;
            }
        }

        // Remove junk
        this.inputMessageBuffer = this.inputMessageBuffer.slice(i);

        // Check for a complete packet
        if (this.inputMessageBuffer.length >= this.HEADER_SIZE) {
            let msgSize = this.inputMessageBuffer.readUInt32LE(this.SIZE_OFFSET);

            if (this.inputMessageBuffer.length >= this.HEADER_SIZE + msgSize + this.CHECKSUM_SIZE) {
                let type = this.inputMessageBuffer.readUInt8(this.TYPE_OFFSET);
                let data = this.inputMessageBuffer.slice(
                    this.HEADER_SIZE,
                    this.HEADER_SIZE + msgSize
                );
                let crc = this.inputMessageBuffer.slice(
                    this.HEADER_SIZE + msgSize,
                    this.HEADER_SIZE + msgSize + this.CHECKSUM_SIZE
                );

                // Remove the processed packet
                this.inputMessageBuffer = this.inputMessageBuffer.slice(
                    this.HEADER_SIZE + msgSize + this.CHECKSUM_SIZE
                );

                // Check CRC32
                if (crc32(data).compare(crc) != 0) {
                    this.processInputData(new Buffer(0));
                }

                // Emit the processed packet
                this.emit('packet', type, data);
            }
        }
    }

    writeData(type, buffer) {
        if (buffer.length > Math.pow(2,32) - 1) {
            this.emit('error', 'Message too large');
            return;
        }

        let header = new Buffer(this.HEADER_SIZE); // magic number, type, message ID, size
        this.MAGIC_NUMBER.copy(header);

        header.writeUInt8(type, this.TYPE_OFFSET);
        header.writeUInt32LE(buffer.length, this.SIZE_OFFSET);

        let output = this.serialStream ? this.serialStream : this.outputFile;

        let crc = crc32(buffer);
        output.write(header);
        output.write(buffer);
        output.write(crc);
    }
}

module.exports = Serial;
