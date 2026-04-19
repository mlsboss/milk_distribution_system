def calculate_amount(litres: float, fat: float, rate: float) -> float:
    """
    Formula:
    amount = litres * (fat * rate) / 10
    """
    if litres <= 0:
        raise ValueError("Invalid litres")

    if fat < 0:
        raise ValueError("Invalid fat")

    return (litres * fat * rate) / 10