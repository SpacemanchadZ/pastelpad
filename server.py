"""Pastel Pad local server.

A small static file server for previewing the site on this computer:
- handles many requests at once (threaded, big connection queue)
- supports byte ranges (HTTP 206), which Safari needs to play audio files
- tells the browser not to cache the site's code, so reloads always get the latest

Run:  python3 server.py   then open http://localhost:8765
"""
import http.server
import os
import re
import socketserver

PORT = int(os.environ.get("PORT", "8765"))
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        if not self.path.split("?")[0].endswith(".mp3"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def send_head(self):
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path):
            return super().send_head()
        m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
        size = os.path.getsize(path)
        if not m:
            self.send_error(416, "Bad range")
            return None
        start_s, end_s = m.groups()
        if start_s == "":
            length = int(end_s or 0)
            start, end = max(0, size - length), size - 1
        else:
            start = int(start_s)
            end = int(end_s) if end_s else size - 1
        end = min(end, size - 1)
        if start > end or start >= size:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None
        f = open(path, "rb")
        f.seek(start)
        self._range_left = end - start + 1
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(self._range_left))
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        left = getattr(self, "_range_left", None)
        if left is None:
            return super().copyfile(source, outputfile)
        try:
            while left > 0:
                chunk = source.read(min(64 * 1024, left))
                if not chunk:
                    break
                outputfile.write(chunk)
                left -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass  # the browser stopped listening (normal when audio seeks)
        finally:
            self._range_left = None

    def log_message(self, fmt, *args):
        pass  # keep the terminal quiet


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True
    request_queue_size = 128


if __name__ == "__main__":
    with Server(("", PORT), Handler) as httpd:
        print(f"Pastel Pad running at http://localhost:{PORT}", flush=True)
        httpd.serve_forever()
