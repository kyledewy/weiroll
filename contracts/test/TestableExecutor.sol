pragma solidity ^0.8.4;

import "../IExecutor.sol";

contract TestableExecutor {
    IExecutor public executor;

    constructor(IExecutor _executor) {
        executor = _executor;
    }

    function execute(bytes32[] calldata commands, bytes[] memory state)
        public
    {
        (bool success, bytes memory result) = address(executor).delegatecall(
            abi.encodeWithSelector(IExecutor.execute.selector, commands, state)
        );
        require(success, string(result));
    }
}
