declare namespace Cloudflare {
  interface Env {

    BUCKET?: R2Bucket;
    ROOM_REALTIME?: DurableObjectNamespace;
  }
}
