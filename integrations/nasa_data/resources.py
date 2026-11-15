"""Official challenge links, explicitly distinct from imported experiment artifacts."""

CHALLENGE_URL = "https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/"
RESOURCE_REGISTRY_VERSION = "spaceapps-resources-2026-11-13-v1"

OFFICIAL_RESOURCES = [
    {
        "id": "psi-combustion",
        "title": "PSI Data Repository: Combustion Science",
        "url": "https://psi.nasa.gov/physci/repo/search?q=combustion",
        "kind": "data_repository",
        "role": "Discover original experimental data, versions and source documentation.",
    },
    {
        "id": "nasa-combustion",
        "title": "NASA Combustion Science",
        "url": "https://www.nasa.gov/glenn/glenn-expertise-space-exploration/"
        "physical-sciences-program/combustion-science/",
        "kind": "background",
        "role": "Research and hardware context; experimental measurements remain in PSI.",
    },
    {
        "id": "sciencecasts-combustion",
        "title": "NASA ScienceCasts: The Power of Studying Combustion on the ISS",
        "url": "https://www.youtube.com/watch?v=W1oXykoz9zg",
        "kind": "video",
        "role": "An introduction to combustion research; not a table of measurements.",
    },
    {
        "id": "researchers-guide",
        "title": "A Researcher's Guide to International Space Station Combustion Science",
        "url": "https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/",
        "kind": "background",
        "role": "Research background and investigation context.",
    },
    {
        "id": "apollo-1",
        "title": "Apollo 1",
        "url": "https://sma.nasa.gov/sma-disciplines/accllp/apollo-1",
        "kind": "case_study",
        "role": "Historical mission and fire-safety lessons; not experimental test records.",
    },
    {
        "id": "apollo-13",
        "title": "Apollo 13",
        "url": "https://sma.nasa.gov/sma-disciplines/accllp/apollo-13",
        "kind": "case_study",
        "role": "Historical mission and investigation context.",
    },
    {
        "id": "mir-fire",
        "title": "25 Years Ago: Fire Aboard Space Station Mir",
        "url": "https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/",
        "kind": "case_study",
        "role": "Historical fire event and lessons for crew environments.",
    },
    {
        "id": "fireman-air-tanks",
        "title": "Fireman's Air Tanks",
        "url": "https://spinoff.nasa.gov/node/9582",
        "kind": "earth_application",
        "role": "An Earth application of space technology; not a combustion training label.",
    },
    {
        "id": "fire-detector",
        "title": "Fire Detector",
        "url": "https://spinoff.nasa.gov/node/9407",
        "kind": "earth_application",
        "role": "Smoke-detection technology transfer context.",
    },
    {
        "id": "fire-attire",
        "title": "New Technology for the Fire Attire",
        "url": "https://spinoff.nasa.gov/node/9918",
        "kind": "earth_application",
        "role": "Protective-clothing technology transfer context.",
    },
]

# Link membership is verified; linked pages are not automatically ingested or licensed CC0.
OFFICIAL_RESOURCES = [
    {
        **resource,
        "status": "linked",
        "license": "unknown",
        "sourceId": None,
        "investigationIds": [],
        "listedBy": CHALLENGE_URL + "?tab=resources",
        "checkedAt": "2026-11-13",
        "registryVersion": RESOURCE_REGISTRY_VERSION,
    }
    for resource in OFFICIAL_RESOURCES
]


def model_readiness(release: dict) -> dict:
    """Describe real gates without treating storage tables as a validated model."""
    return {
        "revision": release["revision"],
        "available": False,
        "status": "not_validated",
        "reason": "No validated predictive model artifact is installed.",
        "requirements": [
            {"id": "artifact", "label": "Versioned, validated model artifact", "ready": False},
            {
                "id": "evaluation",
                "label": "Independent evaluation and holdout evidence",
                "ready": False,
            },
            {
                "id": "domain",
                "label": "Material, geometry, gravity and atmosphere applicability domain",
                "ready": False,
            },
            {
                "id": "uncertainty",
                "label": "Validated uncertainty and extrapolation methodology",
                "ready": False,
            },
        ],
        "reviewedRecords": release["stats"].get("independentlyReviewedRuns", 0),
        "notice": "Source-backed research lookup is available. It is not fire-risk prediction "
        "or operational safety certification.",
    }
