def list_safe_get(list, index, default=None):
    try:
        return list[index]
    except IndexError:
        return default


def filter_sensible_field(arg):
    result = {}
    for key, value in arg.items():
        if key.lower().find("password") >= 0:
            value = "*****"
        if isinstance(value, dict):
            value = filter_sensible_field(value)
        result[key] = value
    return result
