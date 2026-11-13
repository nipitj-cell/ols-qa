// usage: swiftc -O frames.swift -o frames && ./frames <video.mp4> <outPrefix> <count>
// Extracts <count> evenly spaced frames, always including the last one, stitched into one labelled strip
// <outPrefix>.jpg — the clip check of the Android SuperApp branch (open the strip before delivering a clip).
import AVFoundation
import AppKit

let args = CommandLine.arguments
let url = URL(fileURLWithPath: args[1])
let prefix = args[2]
let count = Int(args[3]) ?? 8
let asset = AVURLAsset(url: url)
let dur = CMTimeGetSeconds(asset.duration)
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
gen.maximumSize = CGSize(width: 360, height: 800)
var images: [(Double, CGImage)] = []
for i in 0..<count {
  let t = count == 1 ? 0 : min(dur - 0.05, dur * Double(i) / Double(count - 1))
  if let img = try? gen.copyCGImage(at: CMTime(seconds: t, preferredTimescale: 600), actualTime: nil) { images.append((t, img)) }
}
let w = images.map { $0.1.width }.reduce(0, +)
let h = images.map { $0.1.height }.max() ?? 0
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h + 24, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
NSColor.white.setFill(); NSRect(x: 0, y: 0, width: w, height: h + 24).fill()
var x = 0
for (t, img) in images {
  NSGraphicsContext.current!.cgContext.draw(img, in: CGRect(x: x, y: 0, width: img.width, height: img.height))
  let s = String(format: "%.1fs", t) as NSString
  s.draw(at: NSPoint(x: x + 4, y: h + 4), withAttributes: [.font: NSFont.systemFont(ofSize: 14), .foregroundColor: NSColor.black])
  x += img.width
}
NSGraphicsContext.restoreGraphicsState()
let data = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.8])!
try! data.write(to: URL(fileURLWithPath: "\(prefix).jpg"))
print(String(format: "duration=%.1fs frames=%d", dur, images.count))
