import { type NextRequest, NextResponse } from "next/server"

// OAI-PMH API endpoint for metadata harvesting
export async function GET(request: NextRequest, { params }: { params: Promise<{ journalPath: string }> }) {
  const { journalPath } = await params
  const searchParams = request.nextUrl.searchParams
  const verb = searchParams.get("verb")

  const baseUrl = request.nextUrl.origin
  const oaiUrl = `${baseUrl}/api/oai/${journalPath}`

  // Response helper
  const createOAIResponse = (content: string) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/
         http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
  <responseDate>${new Date().toISOString()}</responseDate>
  <request verb="${verb || ""}">${oaiUrl}</request>
  ${content}
</OAI-PMH>`

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    })
  }

  switch (verb) {
    case "Identify":
      return createOAIResponse(`
  <Identify>
    <repositoryName>IamJOS - ${journalPath.toUpperCase()}</repositoryName>
    <baseURL>${oaiUrl}</baseURL>
    <protocolVersion>2.0</protocolVersion>
    <adminEmail>admin@iamjos.id</adminEmail>
    <earliestDatestamp>2020-01-01T00:00:00Z</earliestDatestamp>
    <deletedRecord>no</deletedRecord>
    <granularity>YYYY-MM-DDThh:mm:ssZ</granularity>
    <description>
      <oai-identifier xmlns="http://www.openarchives.org/OAI/2.0/oai-identifier"
                      xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai-identifier
                      http://www.openarchives.org/OAI/2.0/oai-identifier.xsd">
        <scheme>oai</scheme>
        <repositoryIdentifier>iamjos.id</repositoryIdentifier>
        <delimiter>:</delimiter>
        <sampleIdentifier>oai:iamjos.id:article/1</sampleIdentifier>
      </oai-identifier>
    </description>
  </Identify>`)

    case "ListMetadataFormats":
      return createOAIResponse(`
  <ListMetadataFormats>
    <metadataFormat>
      <metadataPrefix>oai_dc</metadataPrefix>
      <schema>http://www.openarchives.org/OAI/2.0/oai_dc.xsd</schema>
      <metadataNamespace>http://www.openarchives.org/OAI/2.0/oai_dc/</metadataNamespace>
    </metadataFormat>
    <metadataFormat>
      <metadataPrefix>marcxml</metadataPrefix>
      <schema>http://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd</schema>
      <metadataNamespace>http://www.loc.gov/MARC21/slim</metadataNamespace>
    </metadataFormat>
  </ListMetadataFormats>`)

    case "ListSets":
      return createOAIResponse(`
  <ListSets>
    <set>
      <setSpec>journal:${journalPath}</setSpec>
      <setName>${journalPath.toUpperCase()} Journal Collection</setName>
    </set>
    <set>
      <setSpec>driver</setSpec>
      <setName>Open Access DRIVERset</setName>
    </set>
  </ListSets>`)

    case "ListIdentifiers":
    case "ListRecords":
      // In a real implementation, this would fetch from database
      return createOAIResponse(`
  <${verb}>
    <header>
      <identifier>oai:iamjos.id:article/sample-1</identifier>
      <datestamp>${new Date().toISOString().split("T")[0]}</datestamp>
      <setSpec>journal:${journalPath}</setSpec>
    </header>
    ${
      verb === "ListRecords"
        ? `
    <metadata>
      <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/"
                 xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>Sample Article Title</dc:title>
        <dc:creator>Sample Author</dc:creator>
        <dc:subject>Sample Subject</dc:subject>
        <dc:description>Sample abstract text...</dc:description>
        <dc:publisher>IamJOS</dc:publisher>
        <dc:date>${new Date().getFullYear()}</dc:date>
        <dc:type>article</dc:type>
        <dc:format>application/pdf</dc:format>
        <dc:identifier>https://iamjos.id/article/sample-1</dc:identifier>
        <dc:language>en</dc:language>
        <dc:rights>CC BY 4.0</dc:rights>
      </oai_dc:dc>
    </metadata>`
        : ""
    }
  </${verb}>`)

    case "GetRecord": {
      const identifier = searchParams.get("identifier")
      if (!identifier) {
        return createOAIResponse(`
  <error code="badArgument">Missing required argument: identifier</error>`)
      }
      return createOAIResponse(`
  <GetRecord>
    <record>
      <header>
        <identifier>${identifier}</identifier>
        <datestamp>${new Date().toISOString().split("T")[0]}</datestamp>
        <setSpec>journal:${journalPath}</setSpec>
      </header>
      <metadata>
        <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/"
                   xmlns:dc="http://purl.org/dc/elements/1.1/">
          <dc:title>Sample Article</dc:title>
          <dc:creator>Sample Author</dc:creator>
          <dc:publisher>IamJOS</dc:publisher>
          <dc:date>${new Date().getFullYear()}</dc:date>
          <dc:type>article</dc:type>
          <dc:language>en</dc:language>
        </oai_dc:dc>
      </metadata>
    </record>
  </GetRecord>`)
    }

    default:
      return createOAIResponse(`
  <error code="badVerb">Illegal OAI verb: ${verb || "none provided"}</error>`)
  }
}
