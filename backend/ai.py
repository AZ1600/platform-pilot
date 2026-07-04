def analyze_pod(pod):

    status = pod["status"]

    if status == "ImagePullBackOff":
        return {
            "severity": "High",
            "root_cause": "Container image could not be pulled.",
            "recommendation": "Verify the image exists and update the deployment with the correct image.",
            "owner": "Platform Engineering",
        }

    if status == "ErrImagePull":
        return {
            "severity": "High",
            "root_cause": "Image pull failed.",
            "recommendation": "Check image name, registry permissions, and image availability.",
            "owner": "Platform Engineering",
        }

    if status == "CrashLoopBackOff":
        return {
            "severity": "Critical",
            "root_cause": "Application repeatedly crashes after starting.",
            "recommendation": "Inspect pod logs and fix the application startup error.",
            "owner": "Application Team",
        }

    if status == "OOMKilled":
        return {
            "severity": "Critical",
            "root_cause": "Container exceeded its memory limit.",
            "recommendation": "Increase memory limits or optimize application memory usage.",
            "owner": "Application Team",
        }

    return {
        "severity": "Low",
        "root_cause": "No issues detected.",
        "recommendation": "No action required.",
        "owner": "Platform Engineering",
    }