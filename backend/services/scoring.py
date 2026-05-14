from config import DIMENSION_WEIGHTS, SCORE_BANDS


def get_score_band(score: int) -> dict:
    for band in SCORE_BANDS:
        if band["min"] <= score <= band["max"]:
            return band
    return SCORE_BANDS[-1]


def aggregate_scores(dimensions: list[dict]) -> dict:
    weighted_sum = 0.0
    for dim in dimensions:
        weight = DIMENSION_WEIGHTS.get(dim["dimension"], 0.25)
        weighted_sum += dim["score"] * weight

    overall_score = round(weighted_sum)
    band = get_score_band(overall_score)

    dimension_results = []
    for dim in dimensions:
        dim_band = get_score_band(dim["score"])
        dimension_results.append({
            "dimension": dim["dimension"],
            "score": dim["score"],
            "label": dim_band["label"],
            "strengths": dim.get("strengths", []),
            "improvements": dim.get("improvements", []),
            "resources": dim.get("resources", []),
        })

    return {
        "overall_score": overall_score,
        "overall_label": band["label"],
        "overall_message": band["message"],
        "overall_color": band["color"],
        "dimensions": dimension_results,
    }
