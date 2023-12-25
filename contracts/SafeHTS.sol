// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "./IHederaTokenService.sol";
import "./HederaResponseCodes.sol";

library SafeHTS {
    address internal constant precompileAddress = address(0x167);
    // 90 days in seconds
    int32 internal constant defaultAutoRenewPeriod = 7776000;

    error SingleAssociationFailed();
    error TokenTransferFailed();
    error GetTokenInfoFailed();
    error GetTokenCustomFeesFailed();
    error GetTokenTypeFailed();

       /// Allows spender to withdraw from your account multiple times, up to the value amount. If this function is called
    /// again it overwrites the current allowance with value.
    /// Only Applicable to Fungible Tokens
    /// @param token The hedera token address to approve
    /// @param spender the account authorized to spend
    /// @param amount the amount of tokens authorized to spend.
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    function safeApprove(address token, address spender, uint256 amount) internal returns (int responseCode)
    {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.approve.selector,
            token, spender, amount));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
    }

    function safeAssociateToken(address token, address account) internal {
        (bool success, bytes memory result) = precompileAddress.call(abi.encodeWithSelector(IHederaTokenService.associateToken.selector, account, token));
        if (!tryDecodeSuccessResponseCode(success, result)) revert SingleAssociationFailed();
    }

    function safeTransferToken(address token, address sender, address receiver, int64 amount) internal {
        (bool success, bytes memory result) = precompileAddress.call(abi.encodeWithSelector( IHederaTokenService.transferToken.selector, token, sender, receiver, amount));
        if (!tryDecodeSuccessResponseCode(success, result)) revert TokenTransferFailed();
    }

    function safeGetTokenInfo(address token) internal returns (IHederaTokenService.TokenInfo memory tokenInfo) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(abi.encodeWithSelector(IHederaTokenService.getTokenInfo.selector, token));
        (responseCode, tokenInfo) = success ? abi.decode(result, (int32, IHederaTokenService.TokenInfo)) : (HederaResponseCodes.UNKNOWN, tokenInfo);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenInfoFailed();
    }

    function safeGetTokenCustomFees(address token) internal
    returns (IHederaTokenService.FixedFee[] memory fixedFees, IHederaTokenService.FractionalFee[] memory fractionalFees, IHederaTokenService.RoyaltyFee[] memory royaltyFees)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenCustomFees.selector, token));
        (responseCode, fixedFees, fractionalFees, royaltyFees) =
        success
        ? abi.decode(result, (int32, IHederaTokenService.FixedFee[], IHederaTokenService.FractionalFee[], IHederaTokenService.RoyaltyFee[]))
        : (HederaResponseCodes.UNKNOWN, fixedFees, fractionalFees, royaltyFees);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenCustomFeesFailed();
    }

    function safeGetTokenType(address token) internal returns (int32 tokenType) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(abi.encodeWithSelector( IHederaTokenService.getTokenType.selector, token));
        (responseCode, tokenType) = success ? abi.decode(result, (int32, int32)) : (HederaResponseCodes.UNKNOWN, int32(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenTypeFailed();
    }

    function tryDecodeSuccessResponseCode(bool success, bytes memory result) private pure returns (bool) {
        return (success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN) == HederaResponseCodes.SUCCESS;
    }
}
