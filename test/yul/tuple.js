const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Yul Tuple", function () {

  let vm, multiReturn, tupler;

  before(async () => {
    multiReturn = await (await ethers.getContractFactory("MultiReturn")).deploy();
    tupler = await (await ethers.getContractFactory("LibTupler")).deploy();

    const Executor = await ethers.getContractFactory("Executor");
    const executor = await Executor.deploy();

    const TestableExecutor = await ethers.getContractFactory("TestableExecutor");
    vm = await TestableExecutor.deploy(executor.address);
  });

  function execute(commands, state) {
    let encodedCommands = commands.map(([target, func, inargs, outargs]) =>
      ethers.utils.concat([
        target.interface.getSighash(func),
        inargs,
        outargs,
        target.address,
      ])
    );
    return vm.execute(encodedCommands, state);
  }

  it("Should perform a tuple return that's sliced before being fed to another function (first var)", async () => {

    const commands = [
      [multiReturn, "intTuple",      "0x40ffffffffffff", "0x00"],
      [tupler,      "extractElement","0x008001ffffffff", "0x00"],
      [multiReturn, "tupleConsumer", "0x0000ffffffffff", "0xff"]
    ];

    const state = [
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ];


    const tx = await execute(commands, state);

    await expect(tx)
      .to.emit(multiReturn.attach(vm.address), "Calculated")
      .withArgs(0xbad);

    const receipt = await tx.wait();
    console.log(`Tuple return+slice: ${receipt.gasUsed.toNumber()} gas`);
  });

  it("Should perform a tuple return that's sliced before being fed to another function (second var)", async () => {

    const commands = [
      [multiReturn, "intTuple",      "0x40ffffffffffff", "0x00"],
      [tupler,      "extractElement","0x008001ffffffff", "0x00"],
      [multiReturn, "tupleConsumer", "0x0000ffffffffff", "0xff"]
    ];


    const state = [
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000000000000000000000000001",
    ];


    const tx = await execute(commands, state);

    await expect(tx)
      .to.emit(multiReturn.attach(vm.address), "Calculated")
      .withArgs(0xdeed); 

    const receipt = await tx.wait();
    console.log(`Tuple return+slice: ${receipt.gasUsed.toNumber()} gas`);
  });
});
