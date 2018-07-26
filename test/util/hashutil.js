var expect = require('chai').expect;
var HashUtil = require('../../lib/util/hashutil');

describe('hashutil', function () {

  describe('#getRandomHashHexString', function () {

    it('Should return random buffer with 32 byte size', function () {
      var hash1 = HashUtil.getRandomHashHexString();

      expect(hash1).to.be.an.instanceOf(Buffer);
      expect(hash1.length).to.be.equal(32);

      var hash2 = HashUtil.getRandomHashHexString();

      expect(hash2).to.be.an.instanceOf(Buffer);
      expect(hash2.length).to.be.equal(32);

      expect(hash1).to.be.not.deep.equal(hash2);
    });

  })

});