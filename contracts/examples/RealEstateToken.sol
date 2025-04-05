// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RealEstateToken is ERC20, Ownable {
    // Максимальное количество токенов
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18; // 1 миллиард токенов

    // События
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event MaxSupplyUpdated(uint256 newMaxSupply);

    constructor() ERC20("Real Estate Token", "RET") Ownable(msg.sender) {
        // Минтим начальное количество токенов владельцу
        _mint(msg.sender, 100_000_000 * 10 ** 18); // 100 миллионов токенов
    }

    // Функция для минтинга новых токенов (только владелец)
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    // Функция для сжигания токенов
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    // Функция для сжигания токенов с другого адреса (только владелец)
    function burnFrom(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
        emit TokensBurned(account, amount);
    }

    // Функция для получения оставшегося количества токенов для минтинга
    function remainingMintable() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    // Функция для получения информации о токене
    function getTokenInfo()
        external
        view
        returns (
            string memory name,
            string memory symbol,
            uint256 totalSupply,
            uint256 maxSupply,
            uint256 remainingSupply
        )
    {
        return (
            name(),
            symbol(),
            totalSupply(),
            MAX_SUPPLY,
            MAX_SUPPLY - totalSupply()
        );
    }
}
