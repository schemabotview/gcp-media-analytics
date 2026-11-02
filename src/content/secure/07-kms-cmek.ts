import type { Section } from '../types'

export const kmsCmek: Section = {
  id: 'kms-cmek',
  title: 'Cloud KMS: Sun’s own key on the raw zone',
  scene: 'secure-kms',
  narration:
    "Everything in Cloud Storage is already encrypted, with keys Google manages. Some data, like a C R M extract full of names and phone numbers, is better encrypted with a key the company controls: it can rotate it, audit its use, and switch it off. That is a customer managed encryption key, and Cloud K M S holds it. The editor shows the K M S module. A key ring called K R media, in London. A comment warns that a key ring can never be deleted, ever, which matters for tearing a project down. Inside it, a key called K raw, rotating every ninety days. The highlighted grant is the subtle part. The bucket doesn't encrypt anything itself: Cloud Storage's own service agent does, so that agent gets the encrypter decrypter role on this one key. In the terminal, the apply creates the K M S A P I, the ring, the key and the grant, then changes the raw bucket in place, setting K raw as its default key. Describing the bucket confirms its default key. The side pane draws the chain: ring, key, version, bucket. Every new object is encrypted with the key's current version. When it rotates, new objects get the new version, and old ones stay readable. The table names who encrypts, and with what. Next, every job account gets the roles it needs, and nothing more.",
}
