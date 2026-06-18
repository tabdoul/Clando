package com.example.Clando.service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DjomyService {

    @Value("${djomy.client.id}")
    private String clientId;

    @Value("${djomy.client.secret}")
    private String clientSecret;

    @Value("${djomy.base.url}")
    private String baseUrl;
    public String getClientSecret() {
    return clientSecret;
}

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateHmac(String data, String secret) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(
            secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] hashBytes = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    public String generateApiKey() throws Exception {
        String signature = generateHmac(clientId, clientSecret);
        return clientId + ":" + signature;
    }

    public String getAccessToken() throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-KEY", generateApiKey());

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(new HashMap<>(), headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/v1/auth",
                HttpMethod.POST,
                request,
                Map.class
            );
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) body.get("data");
                if (data != null && data.containsKey("accessToken")) {
                    return (String) data.get("accessToken");
                }
            }
            throw new RuntimeException("Impossible d'obtenir le token Djomy");
        } catch (Exception e) {
            System.out.println("=== Erreur auth: " + e.getMessage());
            throw e;
        }
    }

    public Map<String, Object> initierPaiement(
            String numeroTelephone,
            double montant,
            String reference,
            String description) throws Exception {

        String token = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-KEY", generateApiKey());
        headers.setBearerAuth(token);

        Map<String, Object> body = new HashMap<>();
        body.put("paymentMethod", "OM");
        body.put("payerIdentifier", numeroTelephone);
        body.put("amount", montant);
        body.put("countryCode", "GN");
        body.put("description", description);
        body.put("merchantPaymentReference", reference);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            baseUrl + "/v1/payments",
            HttpMethod.POST,
            request,
            Map.class
        );

        return response.getBody();
    }

    public Map<String, Object> initierPaiementGateway(
            String numeroTelephone,
            double montant,
            String reference,
            String description) throws Exception {

        String token = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-KEY", generateApiKey());
        headers.setBearerAuth(token);

        Map<String, Object> body = new HashMap<>();
        body.put("amount", montant);
        body.put("countryCode", "GN");
        body.put("payerNumber", numeroTelephone);
        body.put("allowedPaymentMethods", List.of("OM"));
        body.put("description", description);
        body.put("merchantPaymentReference", reference);
        body.put("returnUrl", "https://clando-production.up.railway.app/paiement-retour.html");
        body.put("cancelUrl", "https://clando-production.up.railway.app/paiement-annule.html");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        System.out.println("=== Initier paiement gateway: " + body);

        ResponseEntity<Map> response = restTemplate.exchange(
            baseUrl + "/v1/payments/gateway",
            HttpMethod.POST,
            request,
            Map.class
        );

        System.out.println("=== Réponse gateway: " + response.getBody());
        return response.getBody();
    }

    public Map<String, Object> verifierStatutPaiement(String transactionId) throws Exception {
        String token = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-API-KEY", generateApiKey());
        headers.setBearerAuth(token);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            baseUrl + "/v1/payments/" + transactionId + "/status",
            HttpMethod.GET,
            request,
            Map.class
        );

        return response.getBody();
    }
}