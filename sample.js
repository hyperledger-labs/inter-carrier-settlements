/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Sample transaction processor function.
 * @param {tmf.catalyst.blockchain.usecasea.GetCurParticipant} getCurParticipant
 * @transaction
 */
  
async function getCurParticipant(submitCDR) { 
  var me = getCurrentParticipant();
  console.log("here");
  console.log('**** AUTH: ' + me.getIdentifier());
  var participantGood = false;
  console.log(participantGood);
  console.log(me.$type);
  if(me.getIdentifier() === 'admin')
  {
    participantGood = true;
  }
  console.log(participantGood);
  
	// Get the factory for creating new asset instances.
  console.log("Here");
  var queryString = (submitCDR.interconnectEvent.relatedParty.originMCC).toString() + (submitCDR.interconnectEvent.relatedParty.originMNC).toString();
  console.log("First: " + queryString);
  if(me.getIdentifier() === queryString)
  {
    participantGood = true;
  }
  console.log("origin: " + participantGood);
  
  queryString = (submitCDR.interconnectEvent.relatedParty.destinationMCC).toString() + (submitCDR.interconnectEvent.relatedParty.destinationMNC).toString();
  console.log("First: " + queryString);
  if(me.getIdentifier() === queryString)
  {
    participantGood = true;
  }
  console.log("origin: " + participantGood);
}


/**
 * Sample transaction processor function.
 * @param {tmf.catalyst.blockchain.usecasea.SendInterconnectTrafficRequest} SendInterconnectTrafficRequest
 * @transaction
 */
  
async function SendInterconnectTrafficRequest(submitCDR) { 
  console.log(submitCDR.interconnectEvent.length);
  var me = getCurrentParticipant();
  var participantGood = false;
  console.log("here");
  console.log('**** AUTH: ' + me.getIdentifier());
  var tempBilledAmtArray = [];
  if(me.$type === 'NetworkAdmin')
  {
	participantGood = true;
  }
  console.log("here: " + participantGood);

	var networkCDRRegistry =  await getAssetRegistry('tmf.catalyst.blockchain.usecasea.InterConnectCdr');
    var billEventRegistry =  await getAssetRegistry('tmf.catalyst.blockchain.usecasea.InterCarrierBillingRecords');
	// Get the factory for creating new asset instances.
	var factory = await getFactory();
	console.log("Here");
	var interconnectCdrResources = [];
	for (var cnt in submitCDR.interconnectEvent) {
      var originQueryString = (submitCDR.interconnectEvent[cnt].relatedParty.originMCC).toString() + (submitCDR.interconnectEvent[cnt].relatedParty.originMNC).toString();
       var destQueryString = (submitCDR.interconnectEvent[cnt].relatedParty.destinationMCC).toString() + (submitCDR.interconnectEvent[cnt].relatedParty.destinationMNC).toString();      
         
      //Check if we have the right id
      
      if(participantGood === false)
      {
        if(submitCDR.interconnectEvent[cnt].type == "MO" || submitCDR.interconnectEvent[cnt].type == "SMS_MO" || submitCDR.interconnectEvent[cnt].type == "DATA")
        {
          if(me.getIdentifier() === originQueryString)
          {
            participantGood = true;
          }
        }
        else if (submitCDR.interconnectEvent[cnt].type == "MT" || submitCDR.interconnectEvent[cnt].type == "SMS_MT")
        {
          if(me.getIdentifier() === destQueryString)
          {
            participantGood = true;
          }
        }
      }
      if(participantGood === false)
      {
        throw "Wrong Id Used";
      }
      console.log("cnt: " + submitCDR.interconnectEvent[cnt].id);
	  var newCDR = await factory.newResource("tmf.catalyst.blockchain.usecasea","InterConnectCdr",  submitCDR.interconnectEvent[cnt].id);
	  newCDR.homeCarrierCode = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider',(submitCDR.interconnectEvent[cnt].relatedParty.homeMCC).toString() + (submitCDR.interconnectEvent[cnt].relatedParty.homeMNC).toString());
	  newCDR.originCarrierCode = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider', (submitCDR.interconnectEvent[cnt].relatedParty.originMCC).toString() + (submitCDR.interconnectEvent[cnt].relatedParty.originMNC).toString());
	  newCDR.destinationCarrierCode = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider', (submitCDR.interconnectEvent[cnt].relatedParty.destinationMCC).toString() + (submitCDR.interconnectEvent[cnt].relatedParty.destinationMNC).toString());
	  newCDR.interconnectEvent = submitCDR.interconnectEvent[cnt];
	  newCDR.ratedProductUsage = factory.newConcept("tmf.catalyst.blockchain.usecasea", 'RatedProductUsage');
	  var evChargeAmount = 0.0;
	  var evCurrencyCode;
      var queryString = (submitCDR.interconnectEvent[cnt].relatedParty.originMCC).toString() + (submitCDR.interconnectEvent[cnt].relatedParty.originMNC).toString();
      console.log("First: " + queryString);
      var originCarrierAssetArray = await query('getSpecificNetworkProvider', {providerID: queryString});
      console.log("here also: " + originCarrierAssetArray);
      if(originCarrierAssetArray.length != 1)
      {
        throw "error 0";
      }
      var originCarrierAsset = originCarrierAssetArray[0];
      queryString = (submitCDR.interconnectEvent[cnt].relatedParty.destinationMCC).toString() + (submitCDR.interconnectEvent[cnt].relatedParty.destinationMNC).toString();
      console.log(queryString);
      var destinationCarrierAssetArray = await query('getSpecificNetworkProvider', {providerID: queryString});
      if(destinationCarrierAssetArray.length != 1)
      {
        throw "error 1";
      }
      var destinationCarrierAsset = destinationCarrierAssetArray[0];
      
	  if(submitCDR.interconnectEvent[cnt].usageCharacteristic.isInternationalRoaming == true) {
		if(submitCDR.interconnectEvent[cnt].type == "MO") {
		  var evChargeAmount = originCarrierAsset.moRateIntRoam * submitCDR.interconnectEvent[cnt].usageCharacteristic.duration;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
		  evCurrencyCode = originCarrierAsset.providerCurrency;
		}
        else if(submitCDR.interconnectEvent[cnt].type == "MT") {
		  var evChargeAmount = destinationCarrierAsset.mtRateIntRoam * submitCDR.interconnectEvent[cnt].usageCharacteristic.duration;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
//		  evCurrencyCode = destinationCarrierAsset.providerCurrency;
		}
		else if(submitCDR.interconnectEvent[cnt].type == "SMS_MO") {
		  evChargeAmount = originCarrierAsset.smsmoRateIntRoam;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
//		  evCurrencyCode = originCarrierAsset.providerCurrency;
		}
        else if(submitCDR.interconnectEvent[cnt].type == "SMS_MT") {
		  evChargeAmount = destinationCarrierAsset.smsmtRateIntRoam;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
//		  evCurrencyCode = destinationCarrierAsset.providerCurrency;
		}
		else if(submitCDR.interconnectEvent[cnt].type == "DATA") {
		  evChargeAmount = ( ( originCarrierAsset.dataRateIntRoam * (submitCDR.interconnectEvent[cnt].usageCharacteristic.dataVolumeIncoming) ) + (originCarrierAsset.dataRateIntRoam * (submitCDR.interconnectEvent[cnt].usageCharacteristic.dataVolumeOutgoing)));
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
//		  evCurrencyCode = originCarrierAsset.providerCurrency;
		}					 
	  }
	  else if(submitCDR.interconnectEvent[cnt].usageCharacteristic.isMvnoEvent == true) {
		if(submitCDR.interconnectEvent[cnt].type == "MO") {
		  var evChargeAmount = originCarrierAsset.moRateMvnoRoam * submitCDR.interconnectEvent[cnt].usageCharacteristic.duration;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
//		  evCurrencyCode = originCarrierAsset.providerCurrency;
		}
        else if(submitCDR.interconnectEvent[cnt].type == "MT") {
		  var evChargeAmount = destinationCarrierAsset.mtRateMvnoRoam * submitCDR.interconnectEvent[cnt].usageCharacteristic.duration;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
//		  evCurrencyCode = destinationCarrierAsset.providerCurrency;
		}
		else if(submitCDR.interconnectEvent[cnt].type == "SMS_MO") {
		  evChargeAmount = originCarrierAsset.smsmoRateMvnoRoam;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
		  evCurrencyCode = originCarrierAsset.providerCurrency;
		}
        else if(submitCDR.interconnectEvent[cnt].type == "SMS_MT") {
		  evChargeAmount = destinationCarrierAsset.smsmtRateMvnoRoam;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
//		  evCurrencyCode = destinationCarrierAsset.providerCurrency;
		}
		else if(submitCDR.interconnectEvent[cnt].type == "DATA") {
		  evChargeAmount = ( ( originCarrierAsset.dataRateMvnoRoam * (submitCDR.interconnectEvent[cnt].usageCharacteristic.dataVolumeIncoming) ) + (originCarrierAsset.dataRateMvnoRoam * (submitCDR.interconnectEvent[cnt].usageCharacteristic.dataVolumeOutgoing)));
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
//		  evCurrencyCode = originCarrierAsset.providerCurrency;
        }
	  }
	  else if(submitCDR.interconnectEvent[cnt].usageCharacteristic.isNationalRoaming == true) {
		if(submitCDR.interconnectEvent[cnt].type == "MO") {
		  var evChargeAmount = originCarrierAsset.moRateNatRoam * submitCDR.interconnectEvent[cnt].usageCharacteristic.duration;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
		  evCurrencyCode = originCarrierAsset.providerCurrency;
		}
        else if(submitCDR.interconnectEvent[cnt].type == "MT") {
		  var evChargeAmount = destinationCarrierAsset.mtRateNatRoam * submitCDR.interconnectEvent[cnt].usageCharacteristic.duration;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
//		  evCurrencyCode = destinationCarrierAsset.providerCurrency;
		}
		else if(submitCDR.interconnectEvent[cnt].type == "SMS_MO") {
		  evChargeAmount = originCarrierAsset.smsmoRateNatRoam;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
		  evCurrencyCode = originCarrierAsset.providerCurrency;
		}
        else if(submitCDR.interconnectEvent[cnt].type == "SMS_MT") {
		  evChargeAmount = destinationCarrierAsset.smsmtRateNatRoam;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
//		  evCurrencyCode = destinationCarrierAsset.providerCurrency;
		}
		else if(submitCDR.interconnectEvent[cnt].type == "DATA") {
		  evChargeAmount = ( ( originCarrierAsset.dataRateNatRoam * (submitCDR.interconnectEvent[cnt].usageCharacteristic.dataVolumeIncoming) ) + (originCarrierAsset.dataRateNatRoam * (submitCDR.interconnectEvent[cnt].usageCharacteristic.dataVolumeOutgoing)));
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(evChargeAmount);
//		  evCurrencyCode = originCarrierAsset.providerCurrency;
        }
	  }	
	  var chargeChargeAmount = 0.0;
	  	if(submitCDR.interconnectEvent[cnt].type == "MO") {
		  chargeChargeAmount = originCarrierAsset.moRateRet * submitCDR.interconnectEvent[cnt].usageCharacteristic.duration;
		  console.log(chargeChargeAmount);
		  evCurrencyCode = originCarrierAsset.providerCurrency;
		}
        else if(submitCDR.interconnectEvent[cnt].type == "MT") {
		  chargeChargeAmount = destinationCarrierAsset.mtRateRet * submitCDR.interconnectEvent[cnt].usageCharacteristic.duration;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(chargeChargeAmount);
		  evCurrencyCode = destinationCarrierAsset.providerCurrency;
		}
		else if(submitCDR.interconnectEvent[cnt].type == "SMS_MO") {
		  chargeChargeAmount = originCarrierAsset.smsmoRateRet;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(chargeChargeAmount);
		  evCurrencyCode = originCarrierAsset.providerCurrency;
		}
        else if(submitCDR.interconnectEvent[cnt].type == "SMS_MT") {
		  chargeChargeAmount = destinationCarrierAsset.smsmtRateRet;
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(chargeChargeAmount);
		  evCurrencyCode = destinationCarrierAsset.providerCurrency;
		}
		else if(submitCDR.interconnectEvent[cnt].type == "DATA") {
		  chargeChargeAmount = ( ( originCarrierAsset.dataRateRet * (submitCDR.interconnectEvent[cnt].usageCharacteristic.dataVolumeIncoming) ) + (originCarrierAsset.dataRateRet * (submitCDR.interconnectEvent[cnt].usageCharacteristic.dataVolumeOutgoing)));
//		  console.log(evAmt);
//		  evChargeAmount = evAmt.toString();
		  console.log(chargeChargeAmount);
		  evCurrencyCode = originCarrierAsset.providerCurrency;
        }
	  newCDR.ratedProductUsage.chargeAmount = evChargeAmount;
	  newCDR.ratedProductUsage.currencyCode = evCurrencyCode;
	  newCDR.ratedProductUsage.chargeAmountRetail = chargeChargeAmount;
	  tempBilledAmtArray.push(evChargeAmount);
	  newCDR.dataUsageMonitor = factory.newConcept("tmf.catalyst.blockchain.usecasea", 'DataUsageMonitor');
	  var dataThreshold = false;
	  if( ((submitCDR.interconnectEvent[cnt].usageCharacteristic.dataVolumeIncoming) ) + ((submitCDR.interconnectEvent[cnt].usageCharacteristic.dataVolumeOutgoing)) > 104857600 ) {
		  dataThreshold = true;
	  }
	  newCDR.dataUsageMonitor.isThresholdReached = dataThreshold;
	  var blackListMsisdnAssets =  await query('selectAllBlackListMsisdn');
	  console.log('** msisdn **   ' + blackListMsisdnAssets.length);
	  var blackListFound = false;  
	  for (var i = 0; i < blackListMsisdnAssets.length; i++) {
		if(submitCDR.interconnectEvent[cnt].usageCharacteristic.destinationNumber === blackListMsisdnAssets[i].blackListMsisdn) {
		  blackListFound = true;
		  console.log('**  ' + submitCDR.interconnectEvent[cnt].usageCharacteristic.destinationNumber + '  ****  ' + blackListMsisdnAssets[i].blackListMsisdn + '   ****    ' + blackListFound)
//		  newCDR.dataUsageMonitor.isMarkedForFraud = blackListFound.toString();
		  break;
		}
	  } 
	  var blackListMccCodeAssets =  await query('selectAllBlackListMccCode');
	  console.log('** MccCode **   ' + blackListMccCodeAssets.length);
	  for (var j = 0; j < blackListMccCodeAssets.length; j++) {
		if(submitCDR.interconnectEvent[cnt].relatedParty.destinationMCC == blackListMccCodeAssets[j].blackListMccCode) {
		  blackListFound = true;
		  console.log('**  ' + submitCDR.interconnectEvent[cnt].relatedParty.destinationMCC + '  ****  ' + blackListMccCodeAssets[j].blackListMccCode + '   ****    ' + blackListFound)
//		  newCDR.dataUsageMonitor.isMarkedForFraud = blackListFound.toString();
		  break;
		}
	  }
	  newCDR.dataUsageMonitor.isMarkedForFraud = blackListFound;
	  interconnectCdrResources.push(newCDR);
	}
	console.log("Here 1");
	await networkCDRRegistry.addAll(interconnectCdrResources);
	// Emit an event for the modified asset.
	// console.log(cdrResources.length);
	for (var cnt in submitCDR.interconnectEvent) {
      if(submitCDR.interconnectEvent[cnt].usageCharacteristic.isMvnoEvent == true || submitCDR.interconnectEvent[cnt].usageCharacteristic.isInternationalRoaming == true || submitCDR.interconnectEvent[cnt].usageCharacteristic.isNationalRoaming == true)
      {
        var newBillRecord = await factory.newResource("tmf.catalyst.blockchain.usecasea","InterCarrierBillingRecords",  submitCDR.interconnectEvent[cnt].id);
        newBillRecord.billEvent = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'InterConnectCdr',submitCDR.interconnectEvent[cnt].id); 
        newBillRecord.approved = false;
        
        var queryString = (submitCDR.interconnectEvent[cnt].relatedParty.originMCC).toString() + (submitCDR.interconnectEvent[cnt].relatedParty.originMNC).toString();
        console.log("First: " + queryString);
        var originCarrierAssetArray = await query('getSpecificNetworkProvider', {providerID: queryString});
        console.log("here also: " + originCarrierAssetArray);
        if(originCarrierAssetArray.length != 1)
        {
          throw "error 0";
        }
        var originCarrierAsset = originCarrierAssetArray[0];
        
        queryString = (submitCDR.interconnectEvent[cnt].relatedParty.destinationMCC).toString() + (submitCDR.interconnectEvent[cnt].relatedParty.destinationMNC).toString();
        console.log(queryString);
        var destinationCarrierAssetArray = await query('getSpecificNetworkProvider', {providerID: queryString});
        if(destinationCarrierAssetArray.length != 1)
        {
          throw "error 1";
        }
        var destinationCarrierAsset = destinationCarrierAssetArray[0];
        
        queryString = (submitCDR.interconnectEvent[cnt].relatedParty.homeMCC).toString() + (submitCDR.interconnectEvent[cnt].relatedParty.homeMNC).toString();
        console.log(queryString);
        var homeCarrierAssetArray = await query('getSpecificNetworkProvider', {providerID: queryString});
        if(homeCarrierAssetArray.length != 1)
        {
          throw "error 1";
        }
        var homeCarrierAsset = homeCarrierAssetArray[0];
        var tempOriginProvider;
        if(submitCDR.interconnectEvent[cnt].type == "MO") {
		  newBillRecord.originProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider',originCarrierAsset.providerID);
          newBillRecord.billedProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider',homeCarrierAsset.providerID);
          tempOriginProvider = originCarrierAsset;
		}
        else if(submitCDR.interconnectEvent[cnt].type == "MT") {
		  newBillRecord.originProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider',destinationCarrierAsset.providerID);
          newBillRecord.billedProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider',homeCarrierAsset.providerID);
          tempOriginProvider = destinationCarrierAsset;
		}
		else if(submitCDR.interconnectEvent[cnt].type == "SMS_MO") {
		  newBillRecord.originProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider',originCarrierAsset.providerID);
          newBillRecord.billedProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider',homeCarrierAsset.providerID);
          tempOriginProvider = originCarrierAsset;
		}
        else if(submitCDR.interconnectEvent[cnt].type == "SMS_MT") {
		  newBillRecord.originProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider',destinationCarrierAsset.providerID);
          newBillRecord.billedProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider',homeCarrierAsset.providerID);
          tempOriginProvider = destinationCarrierAsset;
		}
		else if(submitCDR.interconnectEvent[cnt].type == "DATA") {
		  newBillRecord.originProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider',originCarrierAsset.providerID);
          newBillRecord.billedProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider',homeCarrierAsset.providerID);
          tempOriginProvider = originCarrierAsset;
        }
//        await billEventRegistry.add(newBillRecord);
// Auto Approve Records if Auto Approve Flag is set and Amount is Less than Approve Limit
        console.log("Before Auto Approve");
        console.log("Auto Carrier: " + homeCarrierAsset.providerID);
        console.log("Auto Carrier: " + homeCarrierAsset.autoApprove);
        console.log("Limit: " + homeCarrierAsset.autoApproveLimit);
        console.log("Billing Carrier: " + tempOriginProvider.providerID);
        console.log("Auto Amount: " + tempBilledAmtArray[cnt] + "cnt: " + cnt);
        console.log("Auto Amount: " + tempBilledAmtArray);
        if(homeCarrierAsset.autoApprove === true && tempBilledAmtArray[cnt] < homeCarrierAsset.autoApproveLimit)
        {
          console.log("Auto Approving");
          var carrierOwedRegistry =  await getAssetRegistry('tmf.catalyst.blockchain.usecasea.InterCarrierOwed');
          newBillRecord.approved = true;
          var queryString = (tempOriginProvider.providerID).toString() + (homeCarrierAsset.providerID).toString();
          console.log(queryString);
          var carrierOwedAssetArray = await query('getSpecificCarrierOwedRecord', {recordID: queryString});

          if(carrierOwedAssetArray.length != 1)
          {
            var newCarOwedAsset = await factory.newResource("tmf.catalyst.blockchain.usecasea","InterCarrierOwed", queryString);
            newCarOwedAsset.originProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider', tempOriginProvider.providerID);
            newCarOwedAsset.billedProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider', homeCarrierAsset.providerID);
            newCarOwedAsset.amount = tempBilledAmtArray[cnt];
            await carrierOwedRegistry.add(newCarOwedAsset);
          }
          else
          {
            var carrierOwedAsset = carrierOwedAssetArray[0];
            carrierOwedAsset.amount = carrierOwedAsset.amount  + tempBilledAmtArray[cnt];
            await carrierOwedRegistry.update(carrierOwedAsset)
          }
        }
        await billEventRegistry.add(newBillRecord);
      }
	  var event = await getFactory().newEvent('tmf.catalyst.blockchain.usecasea', 'newCDREvent');
	  event.cdrID = submitCDR.interconnectEvent[cnt].usageCharacteristic.imsi + submitCDR.interconnectEvent[cnt].usageCharacteristic.startDateTime;  
	  event.homeCarrierCode =  (submitCDR.interconnectEvent[cnt].relatedParty.homeMNC).toString() + (submitCDR.interconnectEvent[cnt].relatedParty.homeMNC).toString();
	  event.originCarrierCode = (submitCDR.interconnectEvent[cnt].relatedParty.originMNC).toString() + (submitCDR.interconnectEvent[cnt].relatedParty.originMNC).toString();
	  event.destinationCarrierCode =  (submitCDR.interconnectEvent[cnt].relatedParty.destinationMNC).toString() + (submitCDR.interconnectEvent[cnt].relatedParty.destinationMCC).toString();
	  emit(event);
	}
  }
  
  
  /**
   * Sample transaction processor function.
   * @param {tmf.catalyst.blockchain.usecasea.Consolidatedbill} consolidatedbill
   * @transaction
   */
	
  async function consolidatedbill(consolidatedbill) { 
  //  transaction Consolidatedbill
  //  o String callType optional
  //  o String isMvnoEvent optional
  //  o String isInternationalRoaming optional
  //  o String isNationalRoaming optional
  //  o String imsi optional
  
	if(consolidatedbill.callType) {
	  console.log(consolidatedbill.callType);
	}
	const factory = getFactory();
	var totalCharge = 0;
    var totalRetailCharge = 0;
	var networkCDRRegistry =  await getAssetRegistry('tmf.catalyst.blockchain.usecasea.InterConnectCdr')
	var eventFlag = 0;
	
	// Make sure neither of the flags are empty
	if(consolidatedbill.isMvnoEvent || consolidatedbill.isInternationalRoaming || consolidatedbill.isNationalRoaming) {
	  if(!consolidatedbill.isMvnoEvent) {
		consolidatedbill.isMvnoEvent = "0";
	  }
	  if(!consolidatedbill.isInternationalRoaming) {
		consolidatedbill.isInternationalRoaming = "0";
	  }
	  if(!consolidatedbill.isNationalRoaming) {
		consolidatedbill.isNationalRoaming = "0";
	  }
	  eventFlag = 1;
	}
	// Place holder for query returns
	var assets; 
	if(consolidatedbill.callType) {
	  if(consolidatedbill.imsi) {
		if(eventFlag == 1) {
		  // callType = Yes AND ims = Yes AND eventFlag = Yes 
		  console.log('callType = Yes AND ims = Yes AND eventFlag = Yes');
		  assets = await query('q8', { type: consolidatedbill.callType, isMvnoEvent: consolidatedbill.isMvnoEvent, isInternationalRoaming: consolidatedbill.isInternationalRoaming, isNationalRoaming: consolidatedbill.isNationalRoaming, imsi: consolidatedbill.imsi});
		}
		else {
		  // callType = Yes AND ims = Yes AND eventFlag = No
		  console.log('callType = Yes AND ims = Yes AND eventFlag = No');
		  assets = await query('q7', { type: consolidatedbill.callType, imsi: consolidatedbill.imsi});
		}
	  }
	  else {
		if(eventFlag == 1) {
		  // callType = Yes AND ims = No AND eventFlag = Yes
		  console.log('callType = Yes AND ims = No AND eventFlag = Yes');
		  console.log('Type:  ' + consolidatedbill.callType + 'mvno: ' + consolidatedbill.isMvnoEvent + 'IRoam:  ' + consolidatedbill.isInternationalRoaming + 'NRoam:  ' + consolidatedbill.isNationalRoaming);
		  assets = await query('q4', { type: consolidatedbill.callType, isMvnoEvent: consolidatedbill.isMvnoEvent, isInternationalRoaming: consolidatedbill.isInternationalRoaming, isNationalRoaming: consolidatedbill.isNationalRoaming});
		}
		else {
		  // callType = Yes AND ims = No AND eventFlag = No
		  console.log('callType = Yes AND ims = No AND eventFlag = No');
		  assets = await query('q5', { type: consolidatedbill.callType});
		}
	  }
	}
	else {
	  if(consolidatedbill.imsi) {
		if(eventFlag == 1) {
		  // callType = No AND ims = Yes AND eventFlag = Yes
		  console.log('callType = No AND ims = Yes AND eventFlag = Yes');
		  assets = await query('q3', { isMvnoEvent: consolidatedbill.isMvnoEvent, isInternationalRoaming: consolidatedbill.isInternationalRoaming, isNationalRoaming: consolidatedbill.isNationalRoaming, imsi: consolidatedbill.imsi});
		}
		else {
		  // callType = No AND ims = Yes AND eventFlag = No
		  console.log('callType = No AND ims = Yes AND eventFlag = No');
		  assets = await query('q6', {imsi: consolidatedbill.imsi});
		}
	  }
	  else {
		if(eventFlag == 1) {
		  // callType = No AND ims = No AND eventFlag = Yes
		  console.log('callType = No AND ims = No AND eventFlag = Yes');
		  console.log('mvno: ' + consolidatedbill.isMvnoEvent + 'IRoam:  ' + consolidatedbill.isInternationalRoaming + 'NRoam:  ' + consolidatedbill.isNationalRoaming);
		  assets = await query('q2', { isMvnoEvent: consolidatedbill.isMvnoEvent, isInternationalRoaming: consolidatedbill.isInternationalRoaming, isNationalRoaming: consolidatedbill.isNationalRoaming});
		}
		else {
		  // callType = No AND ims = Yes AND eventFlag = No
		  console.log('callType = No AND ims = No AND eventFlag = No');
		  assets = await query('q1');
		}
	  }
	}
  
	 // Execute the query.
	console.log(assets.length);
	for(var i = 0; i < assets.length; i++) {
	  console.log('Value of i = ' + i + 'Charge = ' + assets[i].ratedProductUsage.chargeAmount);
	  totalCharge = totalCharge + (assets[i].ratedProductUsage.chargeAmount);
      totalRetailCharge = totalRetailCharge + assets[i].ratedProductUsage.chargeAmountRetail;
	}
	console.log(totalCharge);
	// emit the event
	const billEvent = await factory.newEvent('tmf.catalyst.blockchain.usecasea', 'newBillEvent');
	billEvent.transID = consolidatedbill.transID;
	billEvent.consolidatedAmount = totalCharge;
    billEvent.consolidatedRetailAmount = totalRetailCharge;
	console.log("Here s");
	emit(billEvent);
  }
  

/**
 * Sample transaction processor function.
 * @param {tmf.catalyst.blockchain.usecasea.InitializePayLedger} initializePayLedger
 * @transaction
 */
  
async function initializePayLedger() {
  var factory = await getFactory();
  var carrierOwedRegistry =  await getAssetRegistry('tmf.catalyst.blockchain.usecasea.InterCarrierOwed');
  var providerAssetArray = await query('getAllNetworkProvider');
  for (var i = 0; i < providerAssetArray.length; i++)
  {
    for (var j = 0; j < providerAssetArray.length; j++)
    {
      var queryString = providerAssetArray[i].providerID + providerAssetArray[j].providerID;
      console.log(queryString + "  i: " + i + "  j:  " + j);
      var carrierOwedAssetArray = await query('getSpecificCarrierOwedRecord', {recordID: queryString});
      if(carrierOwedAssetArray.length != 1)
      {
        var newCarOwedAsset = await factory.newResource("tmf.catalyst.blockchain.usecasea","InterCarrierOwed", queryString);
        newCarOwedAsset.originProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider', providerAssetArray[i].providerID);
      newCarOwedAsset.billedProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider', providerAssetArray[j].providerID);
      newCarOwedAsset.amount = 0;
      await carrierOwedRegistry.add(newCarOwedAsset);
      }
    }
  }
}

/**
 * Sample transaction processor function.
 * @param {tmf.catalyst.blockchain.usecasea.ApproveBillRecord} approveBillRecord
 * @transaction
 */
  
async function approveBillRecord(updateCDR) { 
  
  var me = getCurrentParticipant();
  var factory = await getFactory();
  var participantGood = false;
  console.log("here");
  console.log('**** AUTH: ' + me.getIdentifier() + "id: " + updateCDR.billRecord.billedProvider.providerID);
  if(me.$type === 'NetworkAdmin')
  {
    participantGood = true;
  }

  console.log(updateCDR.billRecord.billedProvider.providerID);
  //Check if we have the right id
  if(participantGood === false)
  {
    if(me.getIdentifier() === updateCDR.billRecord.billedProvider.providerID)
    {
      participantGood = true;
    }
  }
  if(participantGood === false)
  {
    throw "Wrong Id Used";
  }
  
  var networkCDRRegistry =  await getAssetRegistry('tmf.catalyst.blockchain.usecasea.InterCarrierBillingRecords');
  var carrierOwedRegistry =  await getAssetRegistry('tmf.catalyst.blockchain.usecasea.InterCarrierOwed');
  console.log(updateCDR.billRecord.approved);
  if(updateCDR.billRecord.approved === true)
  {
    throw "Already Approved";
  }
  updateCDR.billRecord.approved = true;
  await networkCDRRegistry.update(updateCDR.billRecord);
  var queryString = (updateCDR.billRecord.originProvider.providerID).toString() + (updateCDR.billRecord.billedProvider.providerID).toString();
  console.log(queryString);
  var carrierOwedAssetArray = await query('getSpecificCarrierOwedRecord', {recordID: queryString});
  if(carrierOwedAssetArray.length != 1)
  {
//    throw "error 1";

      var newCarOwedAsset = await factory.newResource("tmf.catalyst.blockchain.usecasea","InterCarrierOwed", queryString);
      newCarOwedAsset.originProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider', updateCDR.billRecord.originProvider.providerID);
      newCarOwedAsset.billedProvider = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider', updateCDR.billRecord.billedProvider.providerID);
      newCarOwedAsset.amount = updateCDR.billRecord.billEvent.ratedProductUsage.chargeAmount;
      await carrierOwedRegistry.add(newCarOwedAsset);

  }
  else
  {
    var carrierOwedAsset = carrierOwedAssetArray[0];
    carrierOwedAsset.amount = carrierOwedAsset.amount + updateCDR.billRecord.billEvent.ratedProductUsage.chargeAmount;
    await carrierOwedRegistry.update(carrierOwedAsset);
  }
}

/**
 * Sample transaction processor function.
 * @param {tmf.catalyst.blockchain.usecasea.PayCarrier} payCarrier
 * @transaction
 */
  
async function payCarrier(payCarrier) { 
  var carrierOwedRegistry =  await getAssetRegistry('tmf.catalyst.blockchain.usecasea.InterCarrierOwed');
  console.log(payCarrier.amount);
  var queryString = (payCarrier.toProvider.providerID).toString() + (payCarrier.fromProvider.providerID).toString();
  console.log(queryString);
  var carrierOwedAssetArray = await query('getSpecificCarrierOwedRecord', {recordID: queryString});
  if(carrierOwedAssetArray.length != 1)
  {
    throw "error 1";
  }
  var carrierOwedAsset = carrierOwedAssetArray[0];
  console.log("1: " + carrierOwedAsset.amount);
  carrierOwedAsset.amount = carrierOwedAsset.amount - (payCarrier.amount * payCarrier.fromProvider.providerCurrency.conversionRate)/payCarrier.toProvider.providerCurrency.conversionRate;
  console.log("2: " + carrierOwedAsset.amount);  
  await carrierOwedRegistry.update(carrierOwedAsset);
}

/**
 * Sample transaction processor function.
 * @param {tmf.catalyst.blockchain.usecasea.UpdateInterconnectTrafficRequest} UpdateInterconnectTrafficRequest
 * @transaction
 */
  
async function UpdateInterconnectTrafficRequest(updateCDR) { 
  var networkCDRRegistry =  await getAssetRegistry('tmf.catalyst.blockchain.usecasea.InterConnectCdr')
  // Get the factory for creating new asset instances.
  var factory = await getFactory();
  console.log("Here ****");
  console.log(updateCDR.updateCDR.cdrID);
  var toUpdateCDR = await networkCDRRegistry.get(updateCDR.updateCDR.cdrID);
  
  console.log("Here");
  console.log(toUpdateCDR);
  if(toUpdateCDR) {
//	  var toUpdateCDR = await factory.newResource("tmf.catalyst.blockchain.usecasea","InterConnectCdr",  updateCDR.interconnectEvent.id);
	  toUpdateCDR.homeCarrierCode = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider',(updateCDR.updateCDR.interconnectEvent.relatedParty.homeMCC).toString() + (updateCDR.updateCDR.interconnectEvent.relatedParty.homeMNC).toString());
          toUpdateCDR.originCarrierCode = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider', (updateCDR.updateCDR.interconnectEvent.relatedParty.originMCC).toString() + (updateCDR.updateCDR.interconnectEvent.relatedParty.originMNC).toString());
          toUpdateCDR.destinationCarrierCode = factory.newRelationship("tmf.catalyst.blockchain.usecasea", 'NetworkProvider', (updateCDR.updateCDR.interconnectEvent.relatedParty.destinationMCC).toString() + (updateCDR.updateCDR.interconnectEvent.relatedParty.destinationMNC).toString());
          toUpdateCDR.interconnectEvent = updateCDR.updateCDR.interconnectEvent;
//        toUpdateCDR.ratedProductUsage = factory.newConcept("tmf.catalyst.blockchain.usecasea", 'RatedProductUsage');
          var evChargeAmount = 0.0;
          var evCurrencyCode;
    var queryString = (updateCDR.updateCDR.interconnectEvent.relatedParty.originMCC).toString() + (updateCDR.updateCDR.interconnectEvent.relatedParty.originMNC).toString();
      var originCarrierAssetArray = await query('getSpecificNetworkProvider', {providerID: queryString});
      if(originCarrierAssetArray.length != 1)
      { 
        throw "error";
      }
      var originCarrierAsset = originCarrierAssetArray[0];
    queryString = (updateCDR.updateCDR.interconnectEvent.relatedParty.destinationMCC).toString() + (updateCDR.updateCDR.interconnectEvent.relatedParty.destinationMNC).toString();
      var destinationCarrierAssetArray = await query('getSpecificNetworkProvider', {providerID: queryString});
      if(destinationCarrierAssetArray.length != 1)
      { 
        throw "error 1";
      }
    console.log("Here Also");
      var destinationCarrierAsset = destinationCarrierAssetArray[0];

          if(updateCDR.updateCDR.interconnectEvent.usageCharacteristic.isInternationalRoaming == true) {
                if(updateCDR.updateCDR.interconnectEvent.type == "MO") {
                  var evChargeAmount = originCarrierAsset.moRateIntRoam * updateCDR.updateCDR.interconnectEvent.usageCharacteristic.duration;               
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
                  evCurrencyCode = originCarrierAsset.providerCurrency;
                }
        else if(updateCDR.updateCDR.interconnectEvent.type == "MT") {
                  var evChargeAmount = destinationCarrierAsset.mtRateIntRoam * updateCDR.updateCDR.interconnectEvent.usageCharacteristic.duration;          
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
//                evCurrencyCode = destinationCarrierAsset.providerCurrency;
                }
                else if(updateCDR.updateCDR.interconnectEvent.type == "SMS_MO") {
                  evChargeAmount = originCarrierAsset.smsmoRateIntRoam;
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
//                evCurrencyCode = originCarrierAsset.providerCurrency;
                }
        else if(updateCDR.updateCDR.interconnectEvent.type == "SMS_MT") {
                  evChargeAmount = destinationCarrierAsset.smsmtRateIntRoam;
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
//                evCurrencyCode = destinationCarrierAsset.providerCurrency;
                }
                else if(updateCDR.updateCDR.interconnectEvent.type == "DATA") {
                  evChargeAmount = ( ( originCarrierAsset.dataRateIntRoam * (updateCDR.updateCDR.interconnectEvent.usageCharacteristic.dataVolumeIncoming) ) + (originCarrierAsset.dataRateIntRoam * (updateCDR.updateCDR.interconnectEvent.usageCharacteristic.dataVolumeOutgoing)));
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
//                evCurrencyCode = originCarrierAsset.providerCurrency;
                }
          }
          else if(updateCDR.updateCDR.interconnectEvent.usageCharacteristic.isMvnoEvent == true) {
                if(updateCDR.updateCDR.interconnectEvent.type == "MO") {
                  var evChargeAmount = originCarrierAsset.moRateMvnoRoam * updateCDR.updateCDR.interconnectEvent.usageCharacteristic.duration;
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
//                evCurrencyCode = originCarrierAsset.providerCurrency;
                }
        else if(updateCDR.updateCDR.interconnectEvent.type == "MT") {
                  var evChargeAmount = destinationCarrierAsset.mtRateMvnoRoam * updateCDR.updateCDR.interconnectEvent.usageCharacteristic.duration;
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
//                evCurrencyCode = destinationCarrierAsset.providerCurrency;
                }
                else if(updateCDR.updateCDR.interconnectEvent.type == "SMS_MO") {
                  evChargeAmount = originCarrierAsset.smsmoRateMvnoRoam;
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
                  evCurrencyCode = originCarrierAsset.providerCurrency;
                }
        else if(updateCDR.updateCDR.interconnectEvent.type == "SMS_MT") {
                  evChargeAmount = destinationCarrierAsset.smsmtRateMvnoRoam;
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
//                evCurrencyCode = destinationCarrierAsset.providerCurrency;
                }
                else if(updateCDR.updateCDR.interconnectEvent.type == "DATA") {
                  evChargeAmount = ( ( originCarrierAsset.dataRateMvnoRoam * (updateCDR.updateCDR.interconnectEvent.usageCharacteristic.dataVolumeIncoming) ) + (originCarrierAsset.dataRateMvnoRoam * (updateCDR.updateCDR.interconnectEvent.usageCharacteristic.dataVolumeOutgoing)));
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
//                evCurrencyCode = originCarrierAsset.providerCurrency;
        }
          }
          else if(updateCDR.updateCDR.interconnectEvent.usageCharacteristic.isNationalRoaming == true) {
                if(updateCDR.updateCDR.interconnectEvent.type == "MO") {
                  var evChargeAmount = originCarrierAsset.moRateNatRoam * updateCDR.updateCDR.interconnectEvent.usageCharacteristic.duration;
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
                  evCurrencyCode = originCarrierAsset.providerCurrency;
                }
        else if(updateCDR.updateCDR.interconnectEvent.type == "MT") {
                  var evChargeAmount = destinationCarrierAsset.mtRateNatRoam * updateCDR.updateCDR.interconnectEvent.usageCharacteristic.duration;
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
//                evCurrencyCode = destinationCarrierAsset.providerCurrency;
                }
                else if(updateCDR.updateCDR.interconnectEvent.type == "SMS_MO") {
                  evChargeAmount = originCarrierAsset.smsmoRateNatRoam;
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
                  evCurrencyCode = originCarrierAsset.providerCurrency;
                }
        else if(updateCDR.updateCDR.interconnectEvent.type == "SMS_MT") {
                  evChargeAmount = destinationCarrierAsset.smsmtRateNatRoam;
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
//                evCurrencyCode = destinationCarrierAsset.providerCurrency;
                }
                else if(updateCDR.updateCDR.interconnectEvent.type == "DATA") {
                  evChargeAmount = ( ( originCarrierAsset.dataRateNatRoam * (updateCDR.updateCDR.interconnectEvent.usageCharacteristic.dataVolumeIncoming) ) + (originCarrierAsset.dataRateNatRoam * (updateCDR.updateCDR.interconnectEvent.usageCharacteristic.dataVolumeOutgoing)));
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(evChargeAmount);
//                evCurrencyCode = originCarrierAsset.providerCurrency;
        }
          }    
          var chargeChargeAmount = 0.0;
                if(updateCDR.updateCDR.interconnectEvent.type == "MO") {
                  chargeChargeAmount = originCarrierAsset.moRateRet * updateCDR.updateCDR.interconnectEvent.usageCharacteristic.duration;
                  console.log(chargeChargeAmount);
                  evCurrencyCode = originCarrierAsset.providerCurrency;
                }
        else if(updateCDR.updateCDR.interconnectEvent.type == "MT") {
                  chargeChargeAmount = destinationCarrierAsset.mtRateRet * updateCDR.updateCDR.interconnectEvent.usageCharacteristic.duration;
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(chargeChargeAmount);
                  evCurrencyCode = destinationCarrierAsset.providerCurrency;
                }
                else if(updateCDR.updateCDR.interconnectEvent.type == "SMS_MO") {
                  chargeChargeAmount = originCarrierAsset.smsmoRateRet;
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(chargeChargeAmount);
                  evCurrencyCode = originCarrierAsset.providerCurrency;
                }
        else if(updateCDR.updateCDR.interconnectEvent.type == "SMS_MT") {
                  chargeChargeAmount = destinationCarrierAsset.smsmtRateRet;
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(chargeChargeAmount);
                  evCurrencyCode = destinationCarrierAsset.providerCurrency;
                }
                else if(updateCDR.updateCDR.interconnectEvent.type == "DATA") {
                  chargeChargeAmount = ( ( originCarrierAsset.dataRateRet * (updateCDR.updateCDR.interconnectEvent.usageCharacteristic.dataVolumeIncoming) ) + (originCarrierAsset.dataRateRet * (updateCDR.updateCDR.interconnectEvent.usageCharacteristic.dataVolumeOutgoing)));
//                console.log(evAmt);
//                evChargeAmount = evAmt.toString();
                  console.log(chargeChargeAmount);
                  evCurrencyCode = originCarrierAsset.providerCurrency;
        }
          toUpdateCDR.ratedProductUsage.chargeAmount = evChargeAmount;
          toUpdateCDR.ratedProductUsage.currencyCode = evCurrencyCode;
          toUpdateCDR.ratedProductUsage.chargeAmountRetail = chargeChargeAmount;
    console.log("Here jkjkj");
//        toUpdateCDR.dataUsageMonitor = factory.newConcept("tmf.catalyst.blockchain.usecasea", 'DataUsageMonitor');
          var dataThreshold = false;
          if( ((updateCDR.updateCDR.interconnectEvent.usageCharacteristic.dataVolumeIncoming) ) + ((updateCDR.updateCDR.interconnectEvent.usageCharacteristic.dataVolumeOutgoing)) > 104857600 ) {
                  dataThreshold = true;
          }
          toUpdateCDR.dataUsageMonitor.isThresholdReached = dataThreshold;
          var blackListMsisdnAssets =  await query('selectAllBlackListMsisdn');
          console.log('** msisdn **   ' + blackListMsisdnAssets.length);
          var blackListFound = false;
          for (var i = 0; i < blackListMsisdnAssets.length; i++) {
                if(updateCDR.updateCDR.interconnectEvent.usageCharacteristic.destinationNumber === blackListMsisdnAssets[i].blackListMsisdn) {
                  blackListFound = true;
                  console.log('**  ' + updateCDR.updateCDR.interconnectEvent.usageCharacteristic.destinationNumber + '  ****  ' + blackListMsisdnAssets[i].blackListMsisdn + '   ****    ' + blackListFound)
//                toUpdateCDR.dataUsageMonitor.isMarkedForFraud = blackListFound.toString();
                  break;
                }
          }
          var blackListMccCodeAssets =  await query('selectAllBlackListMccCode');
          console.log('** MccCode **   ' + blackListMccCodeAssets.length);
          for (var j = 0; j < blackListMccCodeAssets.length; j++) {
                if(updateCDR.updateCDR.relatedParty.destinationMCC == blackListMccCodeAssets[j].blackListMccCode) {
                  blackListFound = true;
                  console.log('**  ' + updateCDR.updateCDR.interconnectEvent.relatedParty.destinationMCC + '  ****  ' + blackListMccCodeAssets[j].blackListMccCode + '   ****    ' + blackListFound)
//                toUpdateCDR.dataUsageMonitor.isMarkedForFraud = blackListFound.toString();
                  break;
                }
          }
          toUpdateCDR.dataUsageMonitor.isMarkedForFraud = blackListFound;
        }
        console.log("Here 1");
        await networkCDRRegistry.update(toUpdateCDR);
        // Emit an event for the modified asset.
        // console.log(cdrResources.length);
        for (var cnt in updateCDR.interconnectEvent) { 
          var event = await getFactory().newEvent('tmf.catalyst.blockchain.usecasea', 'newCDREvent');
          event.cdrID = updateCDR.updateCDR.interconnectEvent.usageCharacteristic.imsi + updateCDR.updateCDR.interconnectEvent.usageCharacteristic.startDateTime;
          event.homeCarrierCode =  (updateCDR.updateCDR.interconnectEvent.relatedParty.homeMNC).toString() + (updateCDR.updateCDR.interconnectEvent.relatedParty.homeMNC).toString();
          event.originCarrierCode = (updateCDR.updateCDR.interconnectEvent.relatedParty.originMNC).toString() + (updateCDR.updateCDR.interconnectEvent.relatedParty.originMNC).toString();
          event.destinationCarrierCode =  (updateCDR.updateCDR.interconnectEvent.relatedParty.destinationMNC).toString() + (updateCDR.updateCDR.interconnectEvent.relatedParty.destinationMCC).toString();
          emit(event);
        }
  }
  

/**
 * Sample transaction processor function.
 * @param {tmf.catalyst.blockchain.usecasea.UpdateInterBill} updateInterBill
 * @transaction
 */
  
async function updateInterBill(updateInterBill) { 
  
  //   o String[] billRecords
  console.log((updateInterBill.billRecords).length);
  var networkInterCDRRegistry =  await getAssetRegistry('tmf.catalyst.blockchain.usecasea.InterCarrierBillingRecords');
  var networkCDRRegistry =  await getAssetRegistry('tmf.catalyst.blockchain.usecasea.InterConnectCdr');
  var factory = await getFactory();
  for(var i = 0; i < (updateInterBill.billRecords).length; i++)
  {
    
    // Get the factory for creating new asset instances.
    console.log("Here ****");
    console.log(updateInterBill.billRecords[i]);
    var toUpdateInterCDR = await networkInterCDRRegistry.get(updateInterBill.billRecords[i]);
    console.log("Here");
    console.log(toUpdateInterCDR);
    if(toUpdateInterCDR) {
      var interCDR = await networkCDRRegistry.get(updateInterBill.billRecords[i]);
      if(interCDR) {
        console.log(interCDR);
        var myEventTime = interCDR.interconnectEvent.usageCharacteristic.endDateTime;
        toUpdateInterCDR.eventTime = myEventTime;
        await networkInterCDRRegistry.update(toUpdateInterCDR);
      }
    }
  }
}
