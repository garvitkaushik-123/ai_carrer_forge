import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.resume_parser import parse_resume_text, extract_skills, extract_links


def test_parse_resume_text_extracts_sections():
    sample_text = """John Doe
john@email.com | github.com/johndoe | linkedin.com/in/johndoe

EXPERIENCE
Software Engineer at Acme Corp (2023-2025)
- Built REST APIs using Python and FastAPI
- Reduced latency by 40%

EDUCATION
BS Computer Science, MIT, 2023

SKILLS
Python, JavaScript, React, FastAPI, PostgreSQL, Docker

PROJECTS
Portfolio Website - Built with React and Tailwind CSS
Data Pipeline - ETL system processing 1M records/day
"""
    result = parse_resume_text(sample_text)
    assert "experience" in result
    assert "education" in result
    assert "skills" in result


def test_extract_skills():
    text = "Python, JavaScript, React, FastAPI, PostgreSQL, Docker, AWS, TensorFlow"
    skills = extract_skills(text)
    assert "Python" in skills
    assert "React" in skills
    assert len(skills) >= 5


def test_extract_links():
    text = "Check out github.com/johndoe and linkedin.com/in/johndoe and my portfolio at johndoe.dev"
    links = extract_links(text)
    assert any("github" in link for link in links)
    assert any("linkedin" in link for link in links)
