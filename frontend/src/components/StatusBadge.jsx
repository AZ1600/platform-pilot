function StatusBadge({ status }) {
  let color = "#22c55e";

  switch (status) {
    case "Running":
      color = "#22c55e";
      break;

    case "CrashLoopBackOff":
      color = "#ef4444";
      break;

    case "ImagePullBackOff":
      color = "#f97316";
      break;

    case "ErrImagePull":
      color = "#f97316";
      break;

    case "Pending":
      color = "#eab308";
      break;

    default:
      color = "#6b7280";
  }

  return (
    <span
      style={{
        background: color,
        color: "white",
        padding: "6px 14px",
        borderRadius: "20px",
        fontWeight: "bold",
      }}
    >
      {status}
    </span>
  );
}

export default StatusBadge;