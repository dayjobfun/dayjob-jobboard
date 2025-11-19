import { NextResponse } from "next/server";

const PINATA_ENDPOINT = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

export async function POST(req: Request) {
  const pinataJwt = process.env.PINATA_JWT;

  if (!pinataJwt) {
    return NextResponse.json(
      { error: "PINATA_JWT is not configured" },
      { status: 500 }
    );
  }

  const payload = await req.json();

  const pinataBody = {
    pinataContent: payload,
    pinataMetadata: {
      name: payload?.type === "TALENT" ? "dayjob-talent" : "dayjob-job",
      keyvalues: {
        app: "DAYJOB.FUN",
        type: payload?.type ?? "UNKNOWN",
      },
    },
  };

  const response = await fetch(PINATA_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pinataBody),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: "Failed to upload to IPFS", details: text },
      { status: 500 }
    );
  }

  const json = await response.json();
  return NextResponse.json({ cid: json.IpfsHash });
}


