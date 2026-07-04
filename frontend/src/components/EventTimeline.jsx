function EventTimeline({ events }) {
  return (
    <>
      <h3>📅 Kubernetes Events</h3>

      {events.length === 0 ? (
        <p>No events.</p>
      ) : (
        events.map((event, index) => (
          <div className="event" key={index}>
            <p>
              <strong>{event.type}</strong> — {event.reason}
            </p>

            <p>{event.message}</p>
          </div>
        ))
      )}
    </>
  );
}

export default EventTimeline;