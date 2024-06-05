// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface iStaking {
    function addToArray(uint index, address _addresses) external;
    function isAddressExists(uint _index, address _addr) external view returns (bool);

    function getWhiteListLength() external view returns (uint);
    function getWhiteListUser(uint i) external view returns (address);

}

