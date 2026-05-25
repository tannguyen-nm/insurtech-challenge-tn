import { TokenStore } from './TokenStore'
import { HttpClient } from './HttpClient'
import { ClaimsNamespace } from './namespaces/ClaimsNamespace'
import { DocumentsNamespace } from './namespaces/DocumentsNamespace'
import type { SDKConfig } from './types'

export class InsuranceSDK {
  readonly claims: ClaimsNamespace
  readonly documents: DocumentsNamespace

  private readonly tokenStore: TokenStore
  private readonly httpClient: HttpClient

  constructor(config: SDKConfig) {
    this.tokenStore = new TokenStore(config)
    this.httpClient = new HttpClient(this.tokenStore, config)
    this.claims = new ClaimsNamespace(this.httpClient)
    this.documents = new DocumentsNamespace(this.httpClient)
  }

  /** @internal Exposed for testing token refresh behavior */
  get _tokenStore(): TokenStore {
    return this.tokenStore
  }
}
