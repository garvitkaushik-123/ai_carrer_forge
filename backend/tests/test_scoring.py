import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.scoring import aggregate_scores, get_score_band


def test_aggregate_scores_weighted_average():
    dimensions = [
        {"dimension": "technical_skills", "score": 80, "strengths": ["a"], "improvements": ["b"], "resources": ["c"]},
        {"dimension": "resume_quality", "score": 60, "strengths": ["a"], "improvements": ["b"], "resources": ["c"]},
        {"dimension": "communication", "score": 70, "strengths": ["a"], "improvements": ["b"], "resources": ["c"]},
        {"dimension": "portfolio", "score": 50, "strengths": ["a"], "improvements": ["b"], "resources": ["c"]},
    ]
    result = aggregate_scores(dimensions)
    # 80*0.35 + 60*0.25 + 70*0.20 + 50*0.20 = 28 + 15 + 14 + 10 = 67
    assert result["overall_score"] == 67
    assert result["overall_label"] == "Almost There"
    assert result["overall_color"] == "yellow"


def test_get_score_band_boundaries():
    assert get_score_band(100)["label"] == "Interview Ready"
    assert get_score_band(80)["label"] == "Interview Ready"
    assert get_score_band(79)["label"] == "Almost There"
    assert get_score_band(60)["label"] == "Almost There"
    assert get_score_band(59)["label"] == "Needs Work"
    assert get_score_band(40)["label"] == "Needs Work"
    assert get_score_band(39)["label"] == "Not Ready"
    assert get_score_band(0)["label"] == "Not Ready"
