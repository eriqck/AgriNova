export function getHealth(req, res) {
  res.json({
    status: "ok",
    service: "thika-sacks-backend",
    timestamp: new Date().toISOString()
  });
}
