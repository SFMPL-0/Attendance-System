// ============================================================
// FILL THESE IN with your Supabase project details
// Supabase Dashboard > Project Settings > API
// ============================================================
const SUPABASE_URL = "https://tedzqudijgbymkansqeh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_h5Sc8eDhDLL9_rXctfAdng_rWVJUu8l";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate (or fetch existing) a unique device ID stored in this browser
function getDeviceId() {
  let id = localStorage.getItem("attendance_device_id");
  if (!id) {
    id = "dev_" + crypto.randomUUID();
    localStorage.setItem("attendance_device_id", id);
  }
  return id;
}

// Haversine formula - distance in meters between two lat/lng points
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Compress an image file (from camera input) before upload
function compressImage(file, maxWidth = 480, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => (img.src = e.target.result);
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadPhoto(blob, path) {
  const { data, error } = await supabaseClient.storage
    .from("attendance-photos")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  const { data: pub } = supabaseClient.storage
    .from("attendance-photos")
    .getPublicUrl(path);
  return pub.publicUrl;
}

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported on this device/browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}
