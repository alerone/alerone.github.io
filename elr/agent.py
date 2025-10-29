import datetime
from zoneinfo import ZoneInfo
from google.adk.agents import Agent

# Definición de la herramienta (Tool)
def get_current_time(city: str) -> dict:
    """Devuelve la hora actual en una ciudad específica.
    Args:
        city (str): El nombre de la ciudad (ej: "New York", "London", "Madrid", "Tokyo").
    Returns:
        dict: Un diccionario con el estado y el resultado (ciudad y hora).
    """
    # Mapeo de ciudades a zonas horarias IANA. Puedes añadir más si lo deseas.
    city_timezones = {
        "new york": "America/New_York",
        "london": "Europe/London",
        "paris": "Europe/Paris",
        "tokyo": "Asia/Tokyo",
        "madrid": "Europe/Madrid",
        "berlin": "Europe/Berlin",
        "sydney": "Australia/Sydney",
        "dubai": "Asia/Dubai"
    }

    normalized_city = city.lower()

    if normalized_city in city_timezones:
        try:
            tz = ZoneInfo(city_timezones[normalized_city])
            current_time = datetime.datetime.now(tz).strftime("%H:%M:%S")
            return {"status": "success", "city": city, "time": current_time}
        except Exception as e:
            return {"status": "error", "error_message": f"No se pudo obtener la hora para {city}: {e}"}
    else:
        return {"status": "error", "error_message": f"No conozco la zona horaria de {city}. Por favor, prueba con otra."}

# Definición del Agente (Agent)
root_agent = Agent(
    model='gemini-1.5-flash',
    name='agente_reloj',
    instruction='Eres un asistente servicial y útil que informa sobre la hora actual en diferentes ciudades del mundo. Para obtener la hora, usa la herramienta "get_current_time". Si te piden una ciudad que no conoces, informa al usuario que no puedes proporcionar esa información.',
    tools=[get_current_time],
)
