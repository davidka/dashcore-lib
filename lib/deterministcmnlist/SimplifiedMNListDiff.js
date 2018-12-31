/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';
var BufferReader = require('../encoding/bufferreader');
var BufferWriter = require('../encoding/bufferwriter');
var BufferUtil = require('../util/buffer');
var _ = require('lodash');
var $ = require('../util/preconditions');
var isHexString = require('../util/js').isHexa;

var SimplifiedMNListEntry = require('./SimplifiedMNListEntry');
var PartialMerkleTree = require('./PartialMerkleTree');
var Transaction = require('../transaction');
var constants = require('../constants');

/**
 * @param {Buffer|Object|string} [arg] - A Buffer, JSON string, or Object representing a MnListDiff
 * @class {SimplifiedMNListDiff}
 * @property {string} baseBlockHash - sha256
 * @property {string} blockHash - sha256
 * @property {PartialMerkleTree} cbTxMerkleTree;
 * @property {Transaction} cbTx;
 * @property {Array<string>} deletedMNs - sha256 hashes of deleted MNs
 * @property {Array<SimplifiedMNListEntry>} mnList
 */
function SimplifiedMNListDiff(arg) {
  if (arg) {
    if (arg instanceof SimplifiedMNListDiff) {
      return arg.copy();
    } else if (BufferUtil.isBuffer(arg)) {
      return SimplifiedMNListDiff.fromBuffer(arg);
    } else if (_.isObject(arg)) {
      return SimplifiedMNListDiff.fromObject(arg);
    } else if (isHexString(arg)) {
      return SimplifiedMNListDiff.fromHexString(arg);
    } else {
      throw new TypeError('Unrecognized argument passed to SimplifiedMNListDiff constructor');
    }
  }
}

/**
 * Creates MnListDiff from a Buffer.
 * @param {Buffer} buffer
 * @return {SimplifiedMNListDiff}
 */
SimplifiedMNListDiff.fromBuffer = function fromBuffer(buffer) {
  var bufferReader = new BufferReader(buffer);
  var data = {};

  data.baseBlockHash = bufferReader.read(constants.SHA256_HASH_SIZE).toString('hex');
  data.blockHash = bufferReader.read(constants.SHA256_HASH_SIZE).toString('hex');

  data.cbTxMerkleTree = PartialMerkleTree.fromBufferReader(bufferReader);
  data.cbTx = new Transaction().fromBufferReader(bufferReader);

  var deletedMNsCount = bufferReader.readVarintNum();
  data.deletedMNs = [];
  for (var i = 0; i < deletedMNsCount; i++) {
    data.deletedMNs.push(bufferReader.read(constants.SHA256_HASH_SIZE).toString('hex'));
  }

  var mnListSize = bufferReader.readVarintNum();
  data.mnList = [];
  for (var i = 0; i < mnListSize; i++) {
    data.mnList.push(SimplifiedMNListEntry.fromBuffer(bufferReader.read(91)));
  }

  return this.fromObject(data);
};

/**
 * @param {string} hexString
 * @return {SimplifiedMNListDiff}
 */
SimplifiedMNListDiff.fromHexString = function fromHexString(hexString) {
  return SimplifiedMNListDiff.fromBuffer(Buffer.from(hexString, 'hex'));
};

/**
 * Serializes mnlist diff to a Buffer
 * @return {Buffer}
 */
SimplifiedMNListDiff.prototype.toBuffer = function toBuffer() {
  var bufferWriter = new BufferWriter();

  bufferWriter.write(Buffer.from(this.baseBlockHash, 'hex'));
  bufferWriter.write(Buffer.from(this.blockHash, 'hex'));

  bufferWriter.write(this.cbTxMerkleTree.toBuffer());
  bufferWriter.write(this.cbTx.toBuffer());

  bufferWriter.writeVarintNum(this.deletedMNs.length);
  this.deletedMNs.forEach(function (deleteMNHash) {
    bufferWriter.write(Buffer.from(deleteMNHash, 'hex'));
  });

  bufferWriter.writeVarintNum(this.mnList.length);
  this.mnList.forEach(function (simplifiedMNListEntry) {
    bufferWriter.write(simplifiedMNListEntry.toBuffer());
  });

  return bufferWriter.toBuffer();
};

/**
 * Creates MNListDiff from object
 * @param obj
 * @return {SimplifiedMNListDiff}
 */
SimplifiedMNListDiff.fromObject = function fromObject(obj) {
  var simplifiedMNListDiff = new SimplifiedMNListDiff();

  simplifiedMNListDiff.baseBlockHash = obj.baseBlockHash;
  simplifiedMNListDiff.blockHash = obj.blockHash;

  /* cbTxMerkleRoot start */
  simplifiedMNListDiff.cbTxMerkleTree = new PartialMerkleTree(obj.cbTxMerkleTree);
  /* cbTxMerkleRoot stop */

  simplifiedMNListDiff.cbTx = new Transaction(obj.cbTx);
  // Copy array of strings
  simplifiedMNListDiff.deletedMNs = obj.deletedMNs.slice();
  simplifiedMNListDiff.mnList = obj.mnList.map(function (SMLEntry) {
    return new SimplifiedMNListEntry(SMLEntry);
  });

  return simplifiedMNListDiff;
};

SimplifiedMNListDiff.prototype.toObject = function toObject() {
  var obj = {};
  obj.baseBlockHash = this.baseBlockHash;
  obj.blockHash = this.blockHash;

  /* cbTxMerkleRoot start */
  obj.cbTxMerkleTree = this.cbTxMerkleTree.toString();
  /* cbTxMerkleRoot stop */

  obj.cbTx = this.cbTx.serialize(true);
  // Copy array of strings
  obj.deletedMNs = this.deletedMNs.slice();
  obj.mnList = this.mnList.map(function (SMLEntry) {
    return SMLEntry.toObject();
  });

  return obj;
};

SimplifiedMNListDiff.prototype.copy = function copy() {
  return SimplifiedMNListDiff.fromBuffer(this.toBuffer());
};

module.exports = SimplifiedMNListDiff;